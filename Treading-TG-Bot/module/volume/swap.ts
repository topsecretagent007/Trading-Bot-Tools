import { AccountInfo, Commitment, LAMPORTS_PER_SOL, SystemProgram, TransactionInstruction } from '@solana/web3.js';

//import { MARKET_STATE_LAYOUT_V3, MARKET_STATE_LAYOUT_V2, LiquidityPoolKeysV4, Liquidity, Percent, Token,TokenAmount } from '@raydium-io/raydium-sdk';
import { Liquidity, Percent, LiquidityPoolKeysV4, LiquidityStateV4, TokenAmount, Token, LiquidityPoolInfo, CurrencyAmount, SOL, BigNumberish } from '@raydium-io/raydium-sdk';
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptAccount,
  getMint,
  NATIVE_MINT,
  RawAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { } from '@raydium-io/raydium-sdk';
import { Pool } from './pool';
import { BN } from 'bn.js';


export class Swap {

  private connection: Connection;
  private decimal: number = 0;
  private pool: Pool;
  private mainKp: Keypair;
  private accountInfo: AccountInfo<Buffer>;

  private poolKeys: LiquidityPoolKeysV4 | undefined;
  tokenAccountRent: number | null = null;
  poolInfo?: LiquidityPoolInfo;

  constructor(
    connection: Connection,
    mainKp: Keypair,
    accountInfo: AccountInfo<Buffer>
  ) {
    this.mainKp = mainKp;
    this.connection = connection;
    this.pool = new Pool(connection);
    this.accountInfo = accountInfo;
  }

  public buy = async (token: PublicKey, kp: Keypair, balance: number, mainKp: Keypair) => {

    if (this.decimal == 0) this.decimal = (await getMint(this.connection, token)).decimals;
    const solBuyAmountLamports = Math.floor((balance - 6 * 10 ** 6) * (1 - Math.random() / 3))
    // const solBuyAmountLamports = 2e5;
    // const solBuyAmountLamports = Math.floor((balance - 4 * 10 ** 6) * 0.5)
    const quoteAta = await getAssociatedTokenAddress(NATIVE_MINT, kp.publicKey);
    const baseAta = await getAssociatedTokenAddress(token, kp.publicKey);

    const slippage = new Percent(1000, 100);
    const inputTokenAmount = new CurrencyAmount(SOL, solBuyAmountLamports);
    const outputToken = new Token(TOKEN_PROGRAM_ID, token, this.decimal);
    if (!this.poolKeys) {
      this.poolKeys = await this.pool.derivePoolKeys(this.accountInfo, mainKp)
      console.log("pool keys is not derived.")
      return;
    }

    if (!this.poolInfo) this.poolInfo = await Liquidity.fetchInfo({ connection: this.connection, poolKeys: this.poolKeys })

    const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
      poolKeys: this.poolKeys,
      poolInfo: this.poolInfo,
      amountIn: inputTokenAmount,
      currencyOut: outputToken,
      slippage,
    });
    const { amountIn, maxAmountIn } = Liquidity.computeAmountIn({
      poolKeys: this.poolKeys,
      poolInfo: this.poolInfo,
      amountOut,
      currencyIn: SOL,
      slippage
    })
    const { innerTransaction: innerBuyIxs } = Liquidity.makeSwapFixedOutInstruction(
      {
        poolKeys: this.poolKeys,
        userKeys: {
          tokenAccountIn: quoteAta,
          tokenAccountOut: baseAta,
          owner: kp.publicKey,
        },
        maxAmountIn: maxAmountIn.raw,
        amountOut: amountOut.raw.div(new BN(2)),
      },
      this.poolKeys.version,
    )

    const { innerTransaction: innerSellIxs } = Liquidity.makeSwapFixedInInstruction(
      {
        poolKeys: this.poolKeys,
        userKeys: {
          tokenAccountIn: baseAta,
          tokenAccountOut: quoteAta,
          owner: kp.publicKey,
        },
        amountIn: amountOut.raw.div(new BN(2)),
        minAmountOut: 0,
      },
      this.poolKeys.version,
    );

    const instructions: TransactionInstruction[] = [];
    const latestBlockhash = await this.connection.getLatestBlockhash();
    instructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 744_452 }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: 183_504 }),
      createAssociatedTokenAccountIdempotentInstruction(
        kp.publicKey,
        quoteAta,
        kp.publicKey,
        NATIVE_MINT,
      ),
      SystemProgram.transfer({
        fromPubkey: kp.publicKey,
        toPubkey: quoteAta,
        lamports: solBuyAmountLamports,
      }),
      createSyncNativeInstruction(quoteAta, TOKEN_PROGRAM_ID),
      createAssociatedTokenAccountIdempotentInstruction(
        kp.publicKey,
        baseAta,
        kp.publicKey,
        token,
      ),
      ...innerBuyIxs.instructions,
    )

    const messageV0 = new TransactionMessage({
      payerKey: kp.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions,
    }).compileToV0Message()

    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([kp])

    // console.log((await connection.simulateTransaction(transaction)))
    const sig = await this.connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true })
    const confirmation = await this.connection.confirmTransaction(
      {
        signature: sig,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        blockhash: latestBlockhash.blockhash,
      },
      "confirmed"
    )
    if (confirmation.value.err) {
      console.log("🚀 ~ buySellToken ~ confirmation.value.err:", confirmation.value.err)
      console.log("Confrimtaion error")
      return sig
    } else {
      console.log(`Buy and sell transaction: https://solscan.io/tx/${sig}`);
    }
  }
  public sell = async (token: PublicKey, kp: Keypair, mainKp: Keypair) => {
    if (this.decimal == 0) this.decimal = (await getMint(this.connection, token)).decimals;
    // const solBuyAmountLamports = 2e5;
    // const solBuyAmountLamports = Math.floor((balance - 4 * 10 ** 6) * 0.5)
    const quoteAta = await getAssociatedTokenAddress(NATIVE_MINT, kp.publicKey);
    const baseAta = await getAssociatedTokenAddress(token, kp.publicKey);

    const sellAmount = await this.getTokenBalance(kp.publicKey, token)

    if (!this.poolKeys) {
      this.poolKeys = await this.pool.derivePoolKeys(this.accountInfo, mainKp)
      console.log("pool keys is not derived.")
      return;
    }

    if (!this.poolInfo) this.poolInfo = await Liquidity.fetchInfo({ connection: this.connection, poolKeys: this.poolKeys })
    if (sellAmount == null) return;
    const { innerTransaction: innerSellIxs } = Liquidity.makeSwapFixedInInstruction(
      {
        poolKeys: this.poolKeys,
        userKeys: {
          tokenAccountIn: baseAta,
          tokenAccountOut: quoteAta,
          owner: kp.publicKey,
        },
        amountIn: new BN(sellAmount).div(new BN(2)),
        minAmountOut: 0,
      },
      this.poolKeys.version,
    );

    const instructions: TransactionInstruction[] = [];
    const latestBlockhash = await this.connection.getLatestBlockhash();
    instructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 744_452 }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: 183_504 }),

      ...innerSellIxs.instructions,
      // createCloseAccountInstruction(
      //   quoteAta,
      //   kp.publicKey,
      //   kp.publicKey,
      // )
    )

    const messageV0 = new TransactionMessage({
      payerKey: kp.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions,
    }).compileToV0Message()

    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([kp])

    // console.log((await connection.simulateTransaction(transaction)))
    const sig = await this.connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true })
    const confirmation = await this.connection.confirmTransaction(
      {
        signature: sig,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        blockhash: latestBlockhash.blockhash,
      },
      "confirmed"
    )
    if (confirmation.value.err) {
      console.log("🚀 ~ buySellToken ~ confirmation.value.err:", confirmation.value.err)
      console.log("Confrimtaion error")
      return sig
    } else {
      console.log(`Buy and sell transaction: https://solscan.io/tx/${sig}`);
    }
  }

  getTokenBalance = async (wallet: PublicKey, tokenMint: PublicKey) => {

    // Fetch the token account details
    const response = await this.connection.getTokenAccountsByOwner(wallet, {
      mint: tokenMint
    });

    if (response.value.length == 0) {
      return 0;
    }

    // Get the balance
    const tokenAccountInfo = await this.connection.getTokenAccountBalance(response.value[0].pubkey);

    // Convert the balance from integer to decimal format
    return tokenAccountInfo.value.uiAmount;
  };

};

