import bs58 from 'bs58';
import { mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { PublicKey, Commitment, Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GetStructureSchema, MARKET_STATE_LAYOUT_V3, publicKey, struct, Token, Liquidity, LiquidityPoolKeys, LiquidityStateV4, MAINNET_PROGRAM_ID, Market, SPL_ACCOUNT_LAYOUT, LiquidityPoolKeysV4 } from '@raydium-io/raydium-sdk';
import dotenv from 'dotenv';
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function getWallet(wallet: string): Keypair {
  // most likely someone pasted the private key in binary format
  if (wallet.startsWith('[')) {
    const raw = new Uint8Array(JSON.parse(wallet))
    return Keypair.fromSecretKey(raw);
  }

  // most likely someone pasted mnemonic
  if (wallet.split(' ').length > 1) {
    const seed = mnemonicToSeedSync(wallet, '');
    const path = `m/44'/501'/0'/0'`; // we assume it's first path
    return Keypair.fromSeed(derivePath(path, seed.toString('hex')).key);
  }

  // most likely someone pasted base58 encoded private key
  return Keypair.fromSecretKey(bs58.decode(wallet));
}

export const MINIMAL_MARKET_STATE_LAYOUT_V3 = struct([publicKey('eventQueue'), publicKey('bids'), publicKey('asks')]);
export type MinimalMarketStateLayoutV3 = typeof MINIMAL_MARKET_STATE_LAYOUT_V3;
export type MinimalMarketLayoutV3 = GetStructureSchema<MinimalMarketStateLayoutV3>;

export async function getMinimalMarketV3(
  connection: Connection,
  marketId: PublicKey,
  commitment?: Commitment,
): Promise<MinimalMarketLayoutV3> {
  const marketInfo = await connection.getAccountInfo(marketId, {
    commitment,
    dataSlice: {
      offset: MARKET_STATE_LAYOUT_V3.offsetOf('eventQueue'),
      length: 32 * 3,
    },
  });

  return MINIMAL_MARKET_STATE_LAYOUT_V3.decode(marketInfo!.data);
}

export function createPoolKeys(
  id: PublicKey,
  accountData: LiquidityStateV4,
  minimalMarketLayoutV3: MinimalMarketLayoutV3,
): LiquidityPoolKeys {
  return {
    id,
    baseMint: accountData.baseMint,
    quoteMint: accountData.quoteMint,
    lpMint: accountData.lpMint,
    baseDecimals: accountData.baseDecimal.toNumber(),
    quoteDecimals: accountData.quoteDecimal.toNumber(),
    lpDecimals: 5,
    version: 4,
    programId: MAINNET_PROGRAM_ID.AmmV4,
    authority: Liquidity.getAssociatedAuthority({
      programId: MAINNET_PROGRAM_ID.AmmV4,
    }).publicKey,
    openOrders: accountData.openOrders,
    targetOrders: accountData.targetOrders,
    baseVault: accountData.baseVault,
    quoteVault: accountData.quoteVault,
    marketVersion: 3,
    marketProgramId: accountData.marketProgramId,
    marketId: accountData.marketId,
    marketAuthority: Market.getAssociatedAuthority({
      programId: accountData.marketProgramId,
      marketId: accountData.marketId,
    }).publicKey,
    marketBaseVault: accountData.baseVault,
    marketQuoteVault: accountData.quoteVault,
    marketBids: minimalMarketLayoutV3.bids,
    marketAsks: minimalMarketLayoutV3.asks,
    marketEventQueue: minimalMarketLayoutV3.eventQueue,
    withdrawQueue: accountData.withdrawQueue,
    lpVault: accountData.lpVault,
    lookupTableAccount: PublicKey.default,
  };
}




dotenv.config();

const retrieveEnvVariable = (variableName: string) => {
  const variable = process.env[variableName] || '';
  if (!variable) {
    console.log(`${variableName} is not set`);
    process.exit(1);
  }
  return variable;
};

// Connection
export const NETWORK = 'mainnet-beta';
export const COMMITMENT_LEVEL: Commitment = retrieveEnvVariable('COMMITMENT_LEVEL') as Commitment;
export const RPC_ENDPOINT = retrieveEnvVariable('RPC_ENDPOINT');
export const RPC_WEBSOCKET_ENDPOINT = retrieveEnvVariable('RPC_WEBSOCKET_ENDPOINT');

// Bot
export const ONE_TOKEN_AT_A_TIME = retrieveEnvVariable('ONE_TOKEN_AT_A_TIME') === 'true';
export const COMPUTE_UNIT_LIMIT = Number(retrieveEnvVariable('COMPUTE_UNIT_LIMIT'));
export const COMPUTE_UNIT_PRICE = Number(retrieveEnvVariable('COMPUTE_UNIT_PRICE'));
export const PRE_LOAD_EXISTING_MARKETS = retrieveEnvVariable('PRE_LOAD_EXISTING_MARKETS') === 'true';
export const CACHE_NEW_MARKETS = retrieveEnvVariable('CACHE_NEW_MARKETS') === 'true';
export const TRANSACTION_EXECUTOR = retrieveEnvVariable('TRANSACTION_EXECUTOR');
export const CUSTOM_FEE = retrieveEnvVariable('CUSTOM_FEE');

// Buy
export const AUTO_BUY_DELAY = Number(retrieveEnvVariable('AUTO_BUY_DELAY'));
export const QUOTE_MINT = retrieveEnvVariable('QUOTE_MINT');
export const MAX_BUY_RETRIES = Number(retrieveEnvVariable('MAX_BUY_RETRIES'));
export const BUY_SLIPPAGE = Number(retrieveEnvVariable('BUY_SLIPPAGE'));

// Sell
export const AUTO_SELL = retrieveEnvVariable('AUTO_SELL') === 'true';
export const AUTO_SELL_DELAY = Number(retrieveEnvVariable('AUTO_SELL_DELAY'));
export const MAX_SELL_RETRIES = Number(retrieveEnvVariable('MAX_SELL_RETRIES'));
export const TAKE_PROFIT = Number(retrieveEnvVariable('TAKE_PROFIT'));
export const STOP_LOSS = Number(retrieveEnvVariable('STOP_LOSS'));
export const PRICE_CHECK_INTERVAL = Number(retrieveEnvVariable('PRICE_CHECK_INTERVAL'));
export const PRICE_CHECK_DURATION = Number(retrieveEnvVariable('PRICE_CHECK_DURATION'));
export const SELL_SLIPPAGE = Number(retrieveEnvVariable('SELL_SLIPPAGE'));

// Filters
export const FILTER_CHECK_INTERVAL = Number(retrieveEnvVariable('FILTER_CHECK_INTERVAL'));
export const FILTER_CHECK_DURATION = Number(retrieveEnvVariable('FILTER_CHECK_DURATION'));
export const CONSECUTIVE_FILTER_MATCHES = Number(retrieveEnvVariable('CONSECUTIVE_FILTER_MATCHES'));
export const CHECK_IF_PUMP_FUN = retrieveEnvVariable('CHECK_IF_PUMP_FUN') === 'true';
export const CHECK_IF_SOCIALS = retrieveEnvVariable('CHECK_IF_SOCIALS') === 'true';
export const MIN_MARKET_CAP =  Number(retrieveEnvVariable('MIN_MARKET_CAP'));
export const MAX_MARKET_CAP = Number(retrieveEnvVariable('MAX_MARKET_CAP'));
export const USE_SNIPE_LIST = retrieveEnvVariable('USE_SNIPE_LIST') === 'true';
export const SNIPE_LIST_REFRESH_INTERVAL = Number(retrieveEnvVariable('SNIPE_LIST_REFRESH_INTERVAL'));

export async function getTokenPriceRaydium(poolKeys: LiquidityPoolKeysV4, connection: Connection): Promise<number|undefined> {
  try {
    if(poolKeys.quoteMint.toString()==NATIVE_MINT.toString()) {
      const solVault = await connection.getAccountInfo(poolKeys.quoteVault)
      const tokenVault = await connection.getAccountInfo(poolKeys.baseVault)
      const solVaultData = SPL_ACCOUNT_LAYOUT.decode(solVault!.data)
      const tokenVaultData = SPL_ACCOUNT_LAYOUT.decode(tokenVault!.data)
      return (solVaultData.amount.div(new BN(LAMPORTS_PER_SOL))).toNumber()/(tokenVaultData.amount.div(new BN(10**poolKeys.baseDecimals))).toNumber()
    } else {
      const solVault = await connection.getAccountInfo(poolKeys.quoteVault)
      const tokenVault = await connection.getAccountInfo(poolKeys.baseVault)
      const tokenVaultData = SPL_ACCOUNT_LAYOUT.decode(solVault!.data)
      const solVaultData = SPL_ACCOUNT_LAYOUT.decode(tokenVault!.data)
      return (solVaultData.amount.div(new BN(LAMPORTS_PER_SOL))).toNumber()/(tokenVaultData.amount.div(new BN(10**poolKeys.baseDecimals))).toNumber()
    }
  } catch(e) {
    console.log(e)
  }
}


export function getToken(token: string) {
  switch (token) {
    case 'WSOL': {
      return Token.WSOL;
    }
    case 'USDC': {
      return new Token(
        TOKEN_PROGRAM_ID,
        new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        6,
        'USDC',
        'USDC',
      );
    }
    default: {
      throw new Error(`Unsupported quote mint "${token}". Supported values are USDC and WSOL`);
    }
  }
}
