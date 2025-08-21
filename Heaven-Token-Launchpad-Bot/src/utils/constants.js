// Solana and Heaven DEX Constants
module.exports = {
  // Solana Constants
  SOLANA: {
    LAMPORTS_PER_SOL: 1000000000,
    MIN_RENT_EXEMPTION: 890880,
    MAX_TRANSACTION_SIZE: 1232,
    MAX_ACCOUNTS: 32,
    MAX_INSTRUCTIONS: 32,
    DEFAULT_COMMITMENT: 'confirmed',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  },

  // Token Constants
  TOKEN: {
    DEFAULT_DECIMALS: 9,
    MIN_DECIMALS: 0,
    MAX_DECIMALS: 18,
    MIN_SUPPLY: 1000,
    MAX_SUPPLY: 1000000000000,
    DEFAULT_TOTAL_SUPPLY: 1000000000
  },

  // Trading Constants
  TRADING: {
    MIN_AMOUNT: 0.001, // Minimum SOL amount for trades
    MAX_AMOUNT: 10.0,  // Maximum SOL amount for trades
    DEFAULT_AMOUNT: 0.1,
    MIN_SLIPPAGE: 0.1,  // 0.1%
    MAX_SLIPPAGE: 50.0, // 50%
    DEFAULT_SLIPPAGE: 5.0,
    MIN_VOLUME: 100,
    MIN_LIQUIDITY: 1000,
    PRICE_PRECISION: 8,
    AMOUNT_PRECISION: 6
  },

  // Strategy Constants
  STRATEGY: {
    MIN_CHECK_INTERVAL: 5000,    // 5 seconds
    MAX_CHECK_INTERVAL: 300000,  // 5 minutes
    DEFAULT_CHECK_INTERVAL: 30000, // 30 seconds
    MIN_COOLDOWN: 10000,         // 10 seconds
    MAX_COOLDOWN: 300000,        // 5 minutes
    DEFAULT_COOLDOWN: 60000,     // 1 minute
    MIN_STOP_LOSS: 0.001,        // 0.1%
    MAX_STOP_LOSS: 0.5,          // 50%
    DEFAULT_STOP_LOSS: 0.05      // 5%
  },

  // Risk Management Constants
  RISK: {
    MAX_DAILY_LOSS: 0.2,         // 20%
    MAX_DRAWDOWN: 0.3,           // 30%
    MAX_POSITION_SIZE: 0.5,      // 50% of balance
    MIN_POSITION_SIZE: 0.01,     // 1% of balance
    MAX_OPEN_TRADES: 10,
    MAX_CONCURRENT_TRADES: 5
  },

  // Market Constants
  MARKET: {
    PRICE_CHANGE_THRESHOLD: 0.05,  // 5%
    VOLUME_SPIKE_THRESHOLD: 1.5,   // 150% of average
    LIQUIDITY_THRESHOLD: 1000,     // Minimum liquidity in SOL
    VOLATILITY_THRESHOLD: 0.1,     // 10% price volatility
    TREND_CONFIRMATION_PERIODS: 3   // Number of periods to confirm trend
  },

  // Transaction Constants
  TRANSACTION: {
    MAX_RETRIES: 3,
    TIMEOUT: 30000,               // 30 seconds
    CONFIRMATION_TIMEOUT: 60000,  // 1 minute
    GAS_LIMIT: 300000,
    GAS_PRICE_MULTIPLIER: 1.1,
    PRIORITY_FEE: 5000            // 5000 lamports
  },

  // Network Constants
  NETWORK: {
    MAINNET: 'mainnet-beta',
    DEVNET: 'devnet',
    TESTNET: 'testnet',
    LOCALNET: 'localnet'
  },

  // RPC Endpoints
  RPC_ENDPOINTS: {
    MAINNET: 'https://api.mainnet-beta.solana.com',
    DEVNET: 'https://api.devnet.solana.com',
    TESTNET: 'https://api.testnet.solana.com',
    HELIUS_MAINNET: 'https://mainnet.helius-rpc.com',
    HELIUS_DEVNET: 'https://devnet.helius-rpc.com'
  },

  // Heaven DEX Constants
  HEAVEN_DEX: {
    FACTORY_ADDRESS: '',
    ROUTER_ADDRESS: '',
    WSOL_ADDRESS: 'So11111111111111111111111111111111111111112',
    MIN_LIQUIDITY: 1000,
    MAX_SLIPPAGE: 50,
    DEFAULT_SLIPPAGE: 5,
    GAS_MULTIPLIER: 1.1
  },

  // Time Constants
  TIME: {
    SECOND: 1000,
    MINUTE: 60000,
    HOUR: 3600000,
    DAY: 86400000,
    WEEK: 604800000,
    MONTH: 2592000000
  },

  // Logging Constants
  LOGGING: {
    LEVELS: {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    },
    DEFAULT_LEVEL: 'info',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 5,
    DATE_FORMAT: 'YYYY-MM-DD HH:mm:ss'
  },

  // Notification Constants
  NOTIFICATIONS: {
    TELEGRAM: {
      MAX_MESSAGE_LENGTH: 4096,
      RATE_LIMIT: 30, // messages per second
      RETRY_ATTEMPTS: 3
    },
    EMAIL: {
      MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 10MB
      RETRY_ATTEMPTS: 3,
      TIMEOUT: 30000
    }
  },

  // Error Codes
  ERROR_CODES: {
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    STRATEGY_ERROR: 'STRATEGY_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
  },

  // Status Constants
  STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    TIMEOUT: 'timeout'
  },

  // Order Types
  ORDER_TYPES: {
    MARKET: 'market',
    LIMIT: 'limit',
    STOP_LOSS: 'stop_loss',
    TAKE_PROFIT: 'take_profit',
    STOP_LIMIT: 'stop_limit'
  },

  // Order Sides
  ORDER_SIDES: {
    BUY: 'buy',
    SELL: 'sell'
  },

  // Position Types
  POSITION_TYPES: {
    LONG: 'long',
    SHORT: 'short'
  }
};
