module.exports = {
  // Network Configuration
  networks: {
    mainnet: {
      rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=',
      name: 'Solana Mainnet',
      chainId: 'mainnet-beta'
    },
    devnet: {
      rpcUrl: 'https://api.devnet.solana.com',
      name: 'Solana Devnet',
      chainId: 'devnet'
    },
    testnet: {
      rpcUrl: 'https://api.testnet.solana.com',
      name: 'Solana Testnet',
      chainId: 'testnet'
    }
  },

  // Bot Configuration
  bot: {
    // General settings
    name: 'Heaven DEX Bot',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    
    // Monitoring settings
    checkInterval: 30000, // 30 seconds
    balanceCheckInterval: 60000, // 1 minute
    reportInterval: 3600000, // 1 hour
    
    // Transaction settings
    maxRetries: 3,
    timeout: 30000,
    gasLimit: 300000,
    
    // Logging
    logLevel: 'info',
    logToFile: true,
    logFile: 'logs/bot.log'
  },

  // Trading Configuration
  trading: {
    // Default strategy parameters
    defaultStrategy: {
      buyThreshold: 0.001,
      sellThreshold: 0.002,
      stopLoss: 0.0005,
      takeProfit: 0.003,
      
      // Position sizing
      baseAmount: 0.1,
      maxAmount: 1.0,
      maxPositionSize: 0.5,
      
      // Risk management
      maxDailyLoss: 0.1,
      maxDrawdown: 0.2,
      
      // Market conditions
      minVolume: 100,
      minLiquidity: 1000,
      maxSlippage: 5,
      
      // Timing
      checkInterval: 30000,
      cooldownPeriod: 60000,
      
      // Advanced features
      trailingStop: false,
      trailingStopDistance: 0.1,
      dca: false,
      dcaInterval: 3600000
    },
    
    // Strategy presets
    presets: {
      conservative: {
        buyThreshold: 0.0008,
        sellThreshold: 0.0015,
        stopLoss: 0.0004,
        baseAmount: 0.05,
        maxAmount: 0.3,
        maxDailyLoss: 0.05,
        maxDrawdown: 0.1
      },
      
      aggressive: {
        buyThreshold: 0.0012,
        sellThreshold: 0.0025,
        stopLoss: 0.0006,
        baseAmount: 0.2,
        maxAmount: 2.0,
        maxDailyLoss: 0.2,
        maxDrawdown: 0.3
      },
      
      scalping: {
        buyThreshold: 0.001,
        sellThreshold: 0.0012,
        stopLoss: 0.0008,
        baseAmount: 0.05,
        maxAmount: 0.5,
        checkInterval: 10000,
        cooldownPeriod: 30000
      }
    }
  },

  // Token Launch Configuration
  tokenLaunch: {
    // Default token parameters
    defaultToken: {
      decimals: 9,
      totalSupply: 1000000000,
      initialLiquidity: 1000,
      initialPrice: 0.001
    },
    
    // Gas estimation
    gasEstimates: {
      createMint: 5000,
      createAccount: 10000,
      mintTokens: 3000,
      addLiquidity: 15000
    },
    
    // Validation
    validation: {
      minNameLength: 3,
      maxNameLength: 32,
      minSymbolLength: 2,
      maxSymbolLength: 10,
      minDecimals: 0,
      maxDecimals: 18,
      minTotalSupply: 1000,
      maxTotalSupply: 1000000000000
    }
  },

  // Heaven DEX Integration
  heavenDex: {
    // API endpoints (these would be the actual Heaven DEX endpoints)
    api: {
      baseUrl: 'https://api.heavendex.com',
      version: 'v1',
      endpoints: {
        tokens: '/tokens',
        pairs: '/pairs',
        liquidity: '/liquidity',
        trades: '/trades',
        price: '/price'
      }
    },
    
    // Contract addresses (example addresses)
    contracts: {
      factory: 'HeavenDEXFactoryAddress',
      router: 'HeavenDEXRouterAddress',
      wsol: 'So11111111111111111111111111111111111111112'
    },
    
    // Trading parameters
    trading: {
      minLiquidity: 1000,
      maxSlippage: 5,
      gasMultiplier: 1.1
    }
  },

  // Analytics Configuration
  analytics: {
    // Data retention
    retention: {
      trades: 90, // days
      marketData: 30, // days
      performance: 365 // days
    },
    
    // Report settings
    reports: {
      daily: true,
      weekly: true,
      monthly: true,
      custom: true
    },
    
    // Metrics to track
    metrics: [
      'profit',
      'volume',
      'trades',
      'success_rate',
      'drawdown',
      'sharpe_ratio',
      'win_rate'
    ]
  },

  // Notification Configuration
  notifications: {
    // Telegram
    telegram: {
      enabled: false,
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      notifications: ['trades', 'alerts', 'reports']
    },
    
    // Email
    email: {
      enabled: false,
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      notifications: ['alerts', 'reports']
    },
    
    // Webhook
    webhook: {
      enabled: false,
      url: process.env.WEBHOOK_URL,
      notifications: ['trades', 'alerts']
    }
  },

  // Security Configuration
  security: {
    // Rate limiting
    rateLimit: {
      requests: 100,
      window: 60000 // 1 minute
    },
    
    // API key validation
    apiKey: {
      required: true,
      minLength: 32,
      maxLength: 64
    },
    
    // Wallet security
    wallet: {
      maxTransactions: 100,
      maxAmount: 10, // SOL
      requireConfirmation: true
    }
  }
};
