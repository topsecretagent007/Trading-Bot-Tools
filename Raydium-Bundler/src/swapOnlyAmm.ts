import {
  Liquidity,
  Percent,
  Token,
  TokenAmount,
  ApiPoolInfoV4,
  LIQUIDITY_STATE_LAYOUT_V4,
  MARKET_STATE_LAYOUT_V3,
  Market,
  SPL_MINT_LAYOUT,
  SPL_ACCOUNT_LAYOUT,
  TokenAccount,
  TxVersion,
  buildSimpleTransaction,
  LOOKUP_TABLE_CACHE,
  LiquidityPoolKeysV4,
  jsonInfo2PoolKeys,
  LiquidityPoolKeys,
} from '@raydium-io/raydium-sdk';
import {
  PublicKey,
  Keypair,
  Connection,
  VersionedTransaction
} from '@solana/web3.js';

import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import { cluster } from '../config';
import { sleep } from './utils';

type WalletTokenAccounts = Awaited<ReturnType<typeof getWalletTokenAccount>>
type TestTxInputInfo = {
  outputToken: Token
  targetPool: string
  inputTokenAmount: TokenAmount
  slippage: Percent
  walletTokenAccounts: WalletTokenAccounts
  wallet: Keypair
}

async function getWalletTokenAccount(connection: Connection, wallet: PublicKey): Promise<TokenAccount[]> {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  });
  return walletTokenAccount.value.map((i) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
  }));
}

async function swapOnlyAmm(connection: Connection, input: TestTxInputInfo, poolKeys: LiquidityPoolKeysV4) {
  // -------- step 1: coumpute amount out --------
  try {
    
  } catch (error) {console.log(error)}
}

async function swapOnlyAmm1(connection: Connection, input: TestTxInputInfo) {
  // -------- pre-action: get pool info --------
  const targetPoolInfo = await formatAmmKeysById(connection, input.targetPool)
  // assert(targetPoolInfo, 'cannot find the target pool')
  const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys

  // -------- step 1: coumpute amount out --------
  const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
    poolKeys: poolKeys,
    poolInfo: await Liquidity.fetchInfo({ connection, poolKeys }),
    amountIn: input.inputTokenAmount,
    currencyOut: input.outputToken,
    slippage: input.slippage,
  })


  // -------- step 2: create instructions by SDK function --------
  const { innerTransactions } = await Liquidity.makeSwapInstructionSimple({
    connection,
    poolKeys,
    userKeys: {
      tokenAccounts: input.walletTokenAccounts,
      owner: input.wallet.publicKey,
    },
    amountIn: input.inputTokenAmount,
    amountOut: minAmountOut,
    fixedSide: 'in',
    makeTxVersion: TxVersion.V0,
    computeBudgetConfig: {
      microLamports: 120_000,
      units: 100_000
    }
  })
  return innerTransactions
}

export async function formatAmmKeysById(connection: Connection, id: string): Promise<ApiPoolInfoV4> {
 
}

export async function getBuyTx(solanaConnection: Connection, wallet: Keypair, baseMint: PublicKey, quoteMint: PublicKey, amount: number, targetPool: string): Promise<VersionedTransaction | null> {
  while (true) {
    // Ensure sufficient SOL balance for transaction fees
    await ensureSufficientBalance(solanaConnection, wallet.publicKey, 2_039_280);

    const baseInfo = await getMint(solanaConnection, baseMint);
    if (baseInfo == null) {
      return null;
    }

    const totalAmount = Math.floor(amount)

    const baseDecimal = baseInfo.decimals;
    const baseToken = new Token(TOKEN_PROGRAM_ID, baseMint, baseDecimal);
    const quoteToken = new Token(TOKEN_PROGRAM_ID, quoteMint, 9);

    const quoteTokenAmount = new TokenAmount(quoteToken, totalAmount);

    // minumum_token = quoteTokenAmount;
    const slippage = new Percent(100, 100);
    const walletTokenAccounts = await getWalletTokenAccount(solanaConnection, wallet.publicKey);

    const instructions = await swapOnlyAmm1(solanaConnection, {
      outputToken: baseToken,
      targetPool,
      inputTokenAmount: quoteTokenAmount,
      slippage,
      walletTokenAccounts,
      wallet: wallet,
    });

    const willSendTx = (await buildSimpleTransaction({
      connection: solanaConnection,
      makeTxVersion: TxVersion.V0,
      payer: wallet.publicKey,
      innerTransactions: instructions,
      addLookupTableInfo: cluster == "devnet" ? undefined : LOOKUP_TABLE_CACHE
    }))[0];

    if (willSendTx instanceof VersionedTransaction) {
      willSendTx.sign([wallet]);
      return willSendTx;
    }
    continue;
  }
}

export async function getSellTx(solanaConnection: Connection, wallet: Keypair, baseMint: PublicKey, quoteMint: PublicKey, amount: string, targetPool: string): Promise<VersionedTransaction | null> {
  
}

export const getBuyTxWithJupiter = async (wallet: Keypair, baseMint: PublicKey, amount: number) => {
 
};

export const getSellTxWithJupiter = async (wallet: Keypair, baseMint: PublicKey, amount: string) => {
 
};

async function ensureSufficientBalance(connection: Connection, wallet: PublicKey, requiredLamports: number): Promise<void> {
  const balance = await getSolBalance(connection, wallet);
  if (balance < requiredLamports) {
    throw new Error(`Insufficient lamports: ${balance}, need ${requiredLamports}`);
  }
}

async function getSolBalance(connection: Connection, wallet: PublicKey): Promise<number> {
  const balance = await connection.getBalance(wallet);
  return balance;
}