import { Commitment, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';

//import { MARKET_STATE_LAYOUT_V3, MARKET_STATE_LAYOUT_V2, LiquidityPoolKeysV4, Liquidity, Percent, Token,TokenAmount } from '@raydium-io/raydium-sdk';
import { Liquidity, Percent, LiquidityPoolKeysV4, LiquidityStateV4, TokenAmount, Token } from '@raydium-io/raydium-sdk';
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
  NATIVE_MINT,
  RawAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { } from '@raydium-io/raydium-sdk';
import { PoolFilters } from './filters';
import { TransactionExecutor } from './txn_exe';
import { createPoolKeys, NETWORK, sleep } from './helpers';
import { Mutex } from 'async-mutex';
import BN from 'bn.js';
import { JitoTransactionExecutor } from './jito_txn_exe';
import { PoolCache } from './pool_cache'
import { SnipeListCache } from './snipe_list_cache'
import { MarketCache } from './market_cache'


export interface SniperConfig {
  wallet: Keypair;
  minMarketCap: number;
  maxMarketCap: number;
  quoteToken: Token;
  quoteAmount: TokenAmount;
  quoteAta: PublicKey;
  oneTokenAtATime: boolean;
  useSnipeList: boolean;
  autoSell: boolean;
  autoBuyDelay: number;
  autoSellDelay: number;
  maxBuyRetries: number;
  maxSellRetries: number;
  unitLimit?: number;
  unitPrice?: number;
  takeProfit: number;
  stopLoss: number;
  buySlippage: number;
  sellSlippage: number;
  priceCheckInterval: number;
  priceCheckDuration: number;
  filterCheckInterval: number;
  filterCheckDuration: number;
  consecutiveMatchCount: number;
}

export class Sniper {
  private readonly poolFilters: PoolFilters;

  // snipe list
  private readonly snipeListCache?: SnipeListCache;

  // one token at the time
  private readonly mutex: Mutex;
  private sellExecutionCount = 0;
  public readonly isJito: boolean = false;

  constructor(
    private readonly connection: Connection,
    private readonly marketStorage: MarketCache,
    private readonly poolStorage: PoolCache,
    private readonly txExecutor: TransactionExecutor,
    readonly config: SniperConfig,
  ) {
    this.isJito = txExecutor instanceof JitoTransactionExecutor;

    this.mutex = new Mutex();
    this.poolFilters = new PoolFilters(connection, {
      quoteToken: this.config.quoteToken,
      minMarketCap: this.config.minMarketCap,
      maxMarketCap: this.config.maxMarketCap,
    });

    // if (this.config.useSnipeList) {
    //   this.snipeListCache = new SnipeListCache();
    //   this.snipeListCache.init();
    // }

  }

  public async buy(accountId: PublicKey, poolState: LiquidityStateV4) {
    console.log({ mint: poolState.baseMint }, `Processing new pool...`);

    if (this.config.autoBuyDelay > 0) {
      console.log({ mint: poolState.baseMint }, `Waiting for ${this.config.autoBuyDelay} ms before buy`);
      await sleep(this.config.autoBuyDelay);
    }

    if (this.config.oneTokenAtATime) {
      if (this.mutex.isLocked() || this.sellExecutionCount > 0) {
        console.log(
          { mint: poolState.baseMint.toString() },
          `Skipping buy because one token at a time is turned on and token is already being processed`,
        );
        return;
      }

      await this.mutex.acquire();
    }

    try {
      const [market, mintAta] = await Promise.all([
        this.marketStorage.get(poolState.marketId.toString()),
        getAssociatedTokenAddress(poolState.baseMint, this.config.wallet.publicKey),
      ]);
      const poolKeys: LiquidityPoolKeysV4 = createPoolKeys(accountId, poolState, market);

      if (!this.config.useSnipeList) {
        const match = await this.filterMatch(poolKeys);

        if (!match) {
          console.log({ mint: poolKeys.baseMint.toString() }, `Skipping buy because pool doesn't match filters`);
          return;
        }
      }

      for (let i = 0; i < this.config.maxBuyRetries; i++) {
        try {
          console.log(
            { mint: poolState.baseMint.toString() },
            `Send buy transaction attempt: ${i + 1}/${this.config.maxBuyRetries}`,
          );
          const tokenOut = new Token(TOKEN_PROGRAM_ID, poolKeys.baseMint, poolKeys.baseDecimals);
          const result = await this.swap(
            poolKeys,
            this.config.quoteAta,
            mintAta,
            this.config.quoteToken,
            tokenOut,
            this.config.quoteAmount,
            this.config.buySlippage,
            this.config.wallet,
            'buy'
          );

          if (result.confirmed) {
            console.log(
              {
                mint: poolState.baseMint.toString(),
                signature: result.signature,
                url: `https://solscan.io/tx/${result.signature}?cluster=${NETWORK}`,
              },
              `Confirmed buy tx`,
            );

            break;
          }

          console.log(
            {
              mint: poolState.baseMint.toString(),
              signature: result.signature,
              error: result.error,
            },
            `Error confirming buy tx`
          );
        } catch (error) {
          console.log({ mint: poolState.baseMint.toString(), error }, `Error confirming buy transaction`);
        }
      }
    } catch (error) {
      console.log({ mint: poolState.baseMint.toString(), error }, `Failed to buy token`);
    } finally {
      if (this.config.oneTokenAtATime) {
        this.mutex.release();
      }
    }
  }

  public async sell(accountId: PublicKey, rawAccount: RawAccount) {
    if (this.config.oneTokenAtATime) {
      this.sellExecutionCount++;
    }

    try {
      console.log({ mint: rawAccount.mint }, `Processing new token...`);

      const poolData = await this.poolStorage.get(rawAccount.mint.toString());

      if (!poolData) {
        console.log({ mint: rawAccount.mint.toString() }, `Token pool data is not found, can't sell`);
        return;
      }

      const tokenIn = new Token(TOKEN_PROGRAM_ID, poolData.state.baseMint, poolData.state.baseDecimal.toNumber());
      const tokenAmountIn = new TokenAmount(tokenIn, rawAccount.amount, true);

      if (tokenAmountIn.isZero()) {
        console.log({ mint: rawAccount.mint.toString() }, `Empty balance, can't sell`);
        return;
      }

      if (this.config.autoSellDelay > 0) {
        console.log({ mint: rawAccount.mint }, `Waiting for ${this.config.autoSellDelay} ms before sell`);
        await sleep(this.config.autoSellDelay);
      }

      const market = await this.marketStorage.get(poolData.state.marketId.toString());
      const poolKeys: LiquidityPoolKeysV4 = createPoolKeys(new PublicKey(poolData.id), poolData.state, market);

      await this.priceMatch(tokenAmountIn, poolKeys);

      for (let i = 0; i < this.config.maxSellRetries; i++) {
        try {
          console.log(
            { mint: rawAccount.mint },
            `Send sell transaction attempt: ${i + 1}/${this.config.maxSellRetries}`,
          );

          const result = await this.swap(
            poolKeys,
            accountId,
            this.config.quoteAta,
            tokenIn,
            this.config.quoteToken,
            tokenAmountIn,
            this.config.sellSlippage,
            this.config.wallet,
            'sell',
          );

          if (result.confirmed) {
            console.log(
              {
                dex: `https://dexscreener.com/solana/${rawAccount.mint.toString()}?maker=${this.config.wallet.publicKey}`,
                mint: rawAccount.mint.toString(),
                signature: result.signature,
                url: `https://solscan.io/tx/${result.signature}?cluster=${NETWORK}`,
              },
              `Confirmed sell tx`,
            );
            break;
          }

          console.log(
            {
              mint: rawAccount.mint.toString(),
              signature: result.signature,
              error: result.error,
            },
            `Error confirming sell tx`,
          );
        } catch (error) {
          console.log({ mint: rawAccount.mint.toString(), error }, `Error confirming sell transaction`);
        }
      }
    } catch (error) {
      console.log({ mint: rawAccount.mint.toString(), error }, `Failed to sell token`);
    } finally {
      if (this.config.oneTokenAtATime) {
        this.sellExecutionCount--;
      }
    }
  }

  // noinspection JSUnusedLocalSymbols
  private async swap(
    poolKeys: LiquidityPoolKeysV4,
    ataIn: PublicKey,
    ataOut: PublicKey,
    tokenIn: Token,
    tokenOut: Token,
    amountIn: TokenAmount,
    slippage: number,
    wallet: Keypair,
    direction: 'buy' | 'sell',
  ) {
    const slippagePercent = new Percent(slippage, 100);
    const poolInfo = await Liquidity.fetchInfo({
      connection: this.connection,
      poolKeys,
    });

    const computedAmountOut = Liquidity.computeAmountOut({
      poolKeys,
      poolInfo,
      amountIn,
      currencyOut: tokenOut,
      slippage: slippagePercent,
    });

    const latestBlockhash = await this.connection.getLatestBlockhash();
    const { innerTransaction } = Liquidity.makeSwapFixedInInstruction(
      {
        poolKeys: poolKeys,
        userKeys: {
          tokenAccountIn: ataIn,
          tokenAccountOut: ataOut,
          owner: wallet.publicKey,
        },
        amountIn: amountIn.raw,
        minAmountOut: computedAmountOut.minAmountOut.raw,
      },
      poolKeys.version,
    );

    const messageV0 = new TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [
        ...(this.isJito
          ? []
          : [
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: this.config.unitPrice || (await this.getFeeForPoolkeys(poolKeys)).med * 2 }),
            ComputeBudgetProgram.setComputeUnitLimit({ units: this.config.unitLimit || 120_000 }),
          ]),
        ...(direction === 'buy'
          ? [
            createAssociatedTokenAccountIdempotentInstruction(
              wallet.publicKey,
              ataOut,
              wallet.publicKey,
              tokenOut.mint,
            ),
          ]
          : []),
        createAssociatedTokenAccountIdempotentInstruction(
          wallet.publicKey,
          ataIn,
          wallet.publicKey,
          NATIVE_MINT,
        ),
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: ataIn,
          lamports: amountIn.raw.toNumber()
        }),
        createSyncNativeInstruction(ataIn, TOKEN_PROGRAM_ID),
        ...innerTransaction.instructions,
        ...(direction === 'sell' ? [createCloseAccountInstruction(ataIn, wallet.publicKey, wallet.publicKey)] : []),
      ],
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    
    transaction.sign([wallet, ...innerTransaction.signers]);

    return this.txExecutor.executeAndConfirm(transaction, latestBlockhash, wallet);
  }
  private async priceMatch(amountIn: TokenAmount, poolKeys: LiquidityPoolKeysV4) {
    if (this.config.priceCheckDuration === 0 || this.config.priceCheckInterval === 0) {
      return;
    }

    const timesToCheck = this.config.priceCheckDuration / this.config.priceCheckInterval;
    const profitFraction = this.config.quoteAmount.mul(this.config.takeProfit).numerator.div(new BN(100));
    const profitAmount = new TokenAmount(this.config.quoteToken, profitFraction, true);
    const takeProfit = this.config.quoteAmount.add(profitAmount);

    const lossFraction = this.config.quoteAmount.mul(this.config.stopLoss).numerator.div(new BN(100));
    const lossAmount = new TokenAmount(this.config.quoteToken, lossFraction, true);
    const stopLoss = this.config.quoteAmount.subtract(lossAmount);
    const slippage = new Percent(this.config.sellSlippage, 100);
    let timesChecked = 0;

    do {
      try {
        const poolInfo = await Liquidity.fetchInfo({
          connection: this.connection,
          poolKeys,
        });

        const amountOut = Liquidity.computeAmountOut({
          poolKeys,
          poolInfo,
          amountIn: amountIn,
          currencyOut: this.config.quoteToken,
          slippage,
        }).amountOut;

        console.log(
          { mint: poolKeys.baseMint.toString() },
          `Take profit: ${takeProfit.toFixed()} | Stop loss: ${stopLoss.toFixed()} | Current: ${amountOut.toFixed()}`,
        );

        if (amountOut.lt(stopLoss)) {
          break;
        }

        if (amountOut.gt(takeProfit)) {
          break;
        }

        await sleep(this.config.priceCheckInterval);
      } catch (e) {
        console.log({ mint: poolKeys.baseMint.toString(), e }, `Failed to check token price`);
      } finally {
        timesChecked++;
      }
    } while (timesChecked < timesToCheck);
  }

  private async filterMatch(poolKeys: LiquidityPoolKeysV4) {
    if (this.config.filterCheckInterval === 0 || this.config.filterCheckDuration === 0) {
      return true;
    }

    const timesToCheck = this.config.filterCheckDuration / this.config.filterCheckInterval;
    let timesChecked = 0;
    let matchCount = 0;

    do {
      try {
        const shouldBuy = await this.poolFilters.execute(poolKeys);

        if (shouldBuy) {
          matchCount++;

          if (this.config.consecutiveMatchCount <= matchCount) {
            console.log(
              { mint: poolKeys.baseMint.toString() },
              `Filter match ${matchCount}/${this.config.consecutiveMatchCount}`,
            );
            return true;
          }
        } else {
          matchCount = 0;
        }

        await sleep(this.config.filterCheckInterval);
      } finally {
        timesChecked++;
      }
    } while (timesChecked < timesToCheck);

    return false;
  }

  private calculateMetrics(recentPrioritizationFees: any) {
    // Calculate average prioritization fee
    const totalPrioritizationFee = recentPrioritizationFees.reduce((sum: any, item: any) => sum + item.prioritizationFee, 0);
    const average = totalPrioritizationFee / recentPrioritizationFees.length;

    // Find highest prioritization fee
    const highest = Math.max(...recentPrioritizationFees.map((item: any) => item.prioritizationFee));

    // Sort fees to calculate median
    const sortedFees = recentPrioritizationFees.map((item: any) => item.prioritizationFee).sort((a: any, b: any) => a - b);
    const medianIndex = Math.floor(sortedFees.length / 2);
    const median = sortedFees.length % 2 === 0 ? (sortedFees[medianIndex - 1] + sortedFees[medianIndex]) / 2 : sortedFees[medianIndex];

    return {
      avg: Math.ceil(average),
      high: Math.ceil(highest),
      med: Math.ceil(median)
    };
  }

  private async getFeeForPoolkeys(poolkeys: any) {
    const fees = await this.connection.getRecentPrioritizationFees({ lockedWritableAccounts: [poolkeys.id, poolkeys.openOrders, poolkeys.targetOrders, poolkeys.marketId, poolkeys.quoteVault, poolkeys.baseVault] })
    return this.calculateMetrics(fees)
  }
}
