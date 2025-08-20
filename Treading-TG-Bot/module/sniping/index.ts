import { PoolCache } from './pool_cache';
import {MarketCache} from './market_cache'
import { Listeners } from './listener';
import { Connection, KeyedAccountInfo, Keypair } from '@solana/web3.js';
import { LIQUIDITY_STATE_LAYOUT_V4, MARKET_STATE_LAYOUT_V3, Token, TokenAmount } from '@raydium-io/raydium-sdk';
import { AccountLayout, getAssociatedTokenAddressSync } from '@solana/spl-token';
// import { Bot, BotConfig } from './swap';
import {
  getToken,
  getWallet,
  COMMITMENT_LEVEL,
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
  PRE_LOAD_EXISTING_MARKETS,
  QUOTE_MINT,
  MAX_MARKET_CAP,
  MIN_MARKET_CAP,
  // QUOTE_AMOUNT,
  // PRIVATE_KEY,
  USE_SNIPE_LIST,
  ONE_TOKEN_AT_A_TIME,
  AUTO_SELL_DELAY,
  MAX_SELL_RETRIES,
  AUTO_SELL,
  MAX_BUY_RETRIES,
  AUTO_BUY_DELAY,
  COMPUTE_UNIT_LIMIT,
  COMPUTE_UNIT_PRICE,
  CACHE_NEW_MARKETS,
  TAKE_PROFIT,
  STOP_LOSS,
  BUY_SLIPPAGE,
  SELL_SLIPPAGE,
  PRICE_CHECK_DURATION,
  PRICE_CHECK_INTERVAL,
  SNIPE_LIST_REFRESH_INTERVAL,
  TRANSACTION_EXECUTOR,
  CUSTOM_FEE,
  FILTER_CHECK_INTERVAL,
  FILTER_CHECK_DURATION,
  CONSECUTIVE_FILTER_MATCHES,
} from './helpers';
import { JitoTransactionExecutor } from './jito_txn_exe';
import { DefaultTransactionExecutor, TransactionExecutor } from './txn_exe';
import { Sniper, SniperConfig } from './swap';

const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
  commitment: COMMITMENT_LEVEL,
});

function printDetails(wallet: Keypair, quoteToken: Token, bot: Sniper) {
  console.log(`                                    
    Welcome to Auto Pump Raydium Listing Sniper (Build from Warp)
  `);

  const botConfig = bot.config;

  console.log('------- CONFIGURATION START -------');
  console.log(`Wallet: ${wallet.publicKey.toString()}`);

  console.log(
    `Using ${TRANSACTION_EXECUTOR} executer: ${bot.isJito || (TRANSACTION_EXECUTOR === 'default' ? true : false)}`,
  );
  if (bot.isJito) {
    console.log(`${TRANSACTION_EXECUTOR} fee: ${CUSTOM_FEE}`);
  } else {
    console.log(`Compute Unit limit: ${botConfig.unitLimit}`);
    console.log(`Compute Unit price (micro lamports): ${botConfig.unitPrice}`);
  }

  console.log(`Single token at the time: ${botConfig.oneTokenAtATime}`);
  console.log(`Pre load existing markets: ${PRE_LOAD_EXISTING_MARKETS}`);
  console.log(`Cache new markets: ${CACHE_NEW_MARKETS}`);

  console.log('- Buy -');
  console.log(`Buy amount: ${botConfig.quoteAmount.toFixed()} ${botConfig.quoteToken.name}`);
  console.log(`Auto buy delay: ${botConfig.autoBuyDelay} ms`);
  console.log(`Max buy retries: ${botConfig.maxBuyRetries}`);
  console.log(`Buy amount (${quoteToken.symbol}): ${botConfig.quoteAmount.toFixed()}`);
  console.log(`Buy slippage: ${botConfig.buySlippage}%`);

  console.log('- Sell -');
  console.log(`Auto sell: ${AUTO_SELL}`);
  console.log(`Auto sell delay: ${botConfig.autoSellDelay} ms`);
  console.log(`Max sell retries: ${botConfig.maxSellRetries}`);
  console.log(`Sell slippage: ${botConfig.sellSlippage}%`);
  console.log(`Price check interval: ${botConfig.priceCheckInterval} ms`);
  console.log(`Price check duration: ${botConfig.priceCheckDuration} ms`);
  console.log(`Take profit: ${botConfig.takeProfit}%`);
  console.log(`Stop loss: ${botConfig.stopLoss}%`);

  console.log('- Snipe list -');
  console.log(`Snipe list: ${botConfig.useSnipeList}`);
  console.log(`Snipe list refresh interval: ${SNIPE_LIST_REFRESH_INTERVAL} ms`);

  if (botConfig.useSnipeList) {
    console.log('- Filters -');
    console.log(`Filters are disabled when snipe list is on`);
  } else {
    console.log('- Filters -');
    console.log(`Filter check interval: ${botConfig.filterCheckInterval} ms`);
    console.log(`Filter check duration: ${botConfig.filterCheckDuration} ms`);
    console.log(`Consecutive filter matches: ${botConfig.consecutiveMatchCount}`);
    console.log(`Min mkt cap (in sol): ${botConfig.minMarketCap}`);
    console.log(`Max mkt cap (in sol): ${botConfig.maxMarketCap}`);
  }
}

export const startSniperBot = async (PRIVATE_KEY: string, QUOTE_AMOUNT: number) => {
  console.log('Bot is starting...');

  const marketCache = new MarketCache(connection);
  const poolCache = new PoolCache();
  let txExecutor: TransactionExecutor;

  switch (TRANSACTION_EXECUTOR) {
    case 'jito': {
      txExecutor = new JitoTransactionExecutor(CUSTOM_FEE, connection);
      break;
    }
    default: {
      txExecutor = new DefaultTransactionExecutor(connection);
      break;
    }
  }

  const wallet = getWallet(PRIVATE_KEY.trim());
  const quoteToken = getToken(QUOTE_MINT);
  const botConfig = <SniperConfig>{
    wallet,
    quoteAta: getAssociatedTokenAddressSync(quoteToken.mint, wallet.publicKey),
    minMarketCap: MIN_MARKET_CAP,
    maxMarketCap: MAX_MARKET_CAP,
    quoteToken,
    quoteAmount: new TokenAmount(quoteToken, QUOTE_AMOUNT, false),
    oneTokenAtATime: ONE_TOKEN_AT_A_TIME,
    useSnipeList: USE_SNIPE_LIST,
    autoSell: AUTO_SELL,
    autoSellDelay: AUTO_SELL_DELAY,
    maxSellRetries: MAX_SELL_RETRIES,
    autoBuyDelay: AUTO_BUY_DELAY,
    maxBuyRetries: MAX_BUY_RETRIES,
    unitLimit: COMPUTE_UNIT_LIMIT,
    unitPrice: COMPUTE_UNIT_PRICE,
    takeProfit: TAKE_PROFIT,
    stopLoss: STOP_LOSS,
    buySlippage: BUY_SLIPPAGE,
    sellSlippage: SELL_SLIPPAGE,
    priceCheckInterval: PRICE_CHECK_INTERVAL,
    priceCheckDuration: PRICE_CHECK_DURATION,
    filterCheckInterval: FILTER_CHECK_INTERVAL,
    filterCheckDuration: FILTER_CHECK_DURATION,
    consecutiveMatchCount: CONSECUTIVE_FILTER_MATCHES,
  };

  const bot = new Sniper(connection, marketCache, poolCache, txExecutor, botConfig);

  if (PRE_LOAD_EXISTING_MARKETS) {
    await marketCache.init({ quoteToken });
  }

  const runTimestamp = Math.floor(new Date().getTime() / 1000);
  const listeners = new Listeners(connection);
  await listeners.start({
    walletPublicKey: wallet.publicKey,
    quoteToken,
    autoSell: AUTO_SELL,
    cacheNewMarkets: CACHE_NEW_MARKETS,
    useGeyser: false
  });

  listeners.on('market', (updatedAccountInfo: KeyedAccountInfo) => {
    const marketState = MARKET_STATE_LAYOUT_V3.decode(updatedAccountInfo.accountInfo.data);
    marketCache.save(updatedAccountInfo.accountId.toString(), marketState);
  });

  listeners.on('pool', async (updatedAccountInfo: KeyedAccountInfo) => {
    const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data);
    const poolOpenTime = parseInt(poolState.poolOpenTime.toString());
    const exists = await poolCache.get(poolState.baseMint.toString());

    if (!exists && poolOpenTime > runTimestamp) {
      poolCache.save(updatedAccountInfo.accountId.toString(), poolState);
      await bot.buy(updatedAccountInfo.accountId, poolState);
    }
  });

  listeners.on('wallet', async (updatedAccountInfo: KeyedAccountInfo) => {
    const accountData = AccountLayout.decode(updatedAccountInfo.accountInfo.data);

    if (accountData.mint.equals(quoteToken.mint)) {
      return;
    }

    await bot.sell(updatedAccountInfo.accountId, accountData);
  });

  printDetails(wallet, quoteToken, bot);
};

// startSniper();
