require('dotenv').config();
const { HeavenDEXBot } = require('./HeavenDEXBot');
const { TradingBot } = require('./TradingBot');
const { TransactionManager } = require('./TransactionManager');
const { StrategyBuilder } = require('./StrategyBuilder');
const { Analytics } = require('./Analytics');

class HeavenDEXBotMain {
  constructor() {
    this.heavenDEXBot = null;
    this.tradingBot = null;
    this.transactionManager = null;
    this.analytics = new Analytics();
    this.isRunning = false;
  }

  /**
   * Initialize the bot with configuration
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Heaven DEX Bot...');
      
      // Validate environment variables
      this.validateEnvironment();
      
      // Initialize components
      this.heavenDEXBot = new HeavenDEXBot({
        rpcUrl: process.env.HELIUS_RPC_URL,
        walletKey: process.env.WALLET_PRIVATE_KEY
      });
      
      this.tradingBot = new TradingBot({
        rpcUrl: process.env.HELIUS_RPC_URL,
        walletKey: process.env.WALLET_PRIVATE_KEY
      });
      
      this.transactionManager = new TransactionManager(process.env.HELIUS_RPC_URL);
      
      console.log('✅ Bot initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize bot:', error);
      throw error;
    }
  }

  /**
   * Start the main bot operations
   */
  async start() {
    try {
      console.log('🎯 Starting Heaven DEX Bot...');
      
      this.isRunning = true;
      
      // Start monitoring and trading
      await this.startMonitoring();
      
    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      this.stop();
    }
  }

  /**
   * Stop the bot
   */
  stop() {
    console.log('🛑 Stopping Heaven DEX Bot...');
    this.isRunning = false;
    
    if (this.tradingBot) {
      this.tradingBot.stopStrategy();
    }
  }

  /**
   * Start monitoring operations
   */
  async startMonitoring() {
    while (this.isRunning) {
      try {
        // Check wallet balances
        await this.checkBalances();
        
        // Monitor market conditions
        await this.monitorMarket();
        
        // Generate periodic reports
        await this.generateReports();
        
        // Wait before next check
        await this.sleep(60000); // 1 minute
        
      } catch (error) {
        console.error('Error in monitoring loop:', error);
        await this.sleep(30000); // Wait 30 seconds on error
      }
    }
  }

  /**
   * Check wallet balances
   */
  async checkBalances() {
    try {
      const walletAddress = process.env.WALLET_PUBLIC_KEY;
      
      if (walletAddress) {
        const solBalance = await this.heavenDEXBot.getSolBalance(walletAddress);
        
        if (solBalance < parseFloat(process.env.MIN_SOL_BALANCE || '0.1')) {
          console.log(`⚠️ Low SOL balance: ${solBalance} SOL`);
        } else {
          console.log(`💰 SOL balance: ${solBalance} SOL`);
        }
      }
    } catch (error) {
      console.error('Error checking balances:', error);
    }
  }

  /**
   * Monitor market conditions
   */
  async monitorMarket() {
    try {
      // This would integrate with Heaven DEX API to monitor market conditions
      console.log('📊 Monitoring market conditions...');
      
      // Add mock market data for demonstration
      this.analytics.addMarketData({
        price: 0.001 + Math.random() * 0.002,
        volume: 1000 + Math.random() * 5000,
        liquidity: 5000 + Math.random() * 10000,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error monitoring market:', error);
    }
  }

  /**
   * Generate periodic reports
   */
  async generateReports() {
    try {
      // Generate daily report at midnight
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        console.log('📊 Generating daily report...');
        
        const report = await this.analytics.generateReport({
          startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          endDate: now,
          format: 'text'
        });
        
        console.log('Daily Report:', report);
      }
    } catch (error) {
      console.error('Error generating reports:', error);
    }
  }

  /**
   * Launch a new token
   */
  async launchToken(tokenConfig) {
    try {
      console.log('🚀 Launching new token...');
      
      if (!this.heavenDEXBot) {
        throw new Error('Bot not initialized');
      }
      
      const result = await this.heavenDEXBot.launchToken(tokenConfig);
      
      console.log('✅ Token launched successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Token launch failed:', error);
      throw error;
    }
  }

  /**
   * Start a trading strategy
   */
  async startTradingStrategy(strategy) {
    try {
      console.log('🤖 Starting trading strategy...');
      
      if (!this.tradingBot) {
        throw new Error('Trading bot not initialized');
      }
      
      await this.tradingBot.startStrategy(strategy);
      
      console.log('✅ Trading strategy started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start trading strategy:', error);
      throw error;
    }
  }

  /**
   * Process a transaction
   */
  async processTransaction(txSignature) {
    try {
      console.log('🔍 Processing transaction:', txSignature);
      
      if (!this.transactionManager) {
        throw new Error('Transaction manager not initialized');
      }
      
      const transaction = await this.transactionManager.fetchTransaction(txSignature);
      const decompiled = await this.transactionManager.decompileTransaction(transaction);
      const rebuilt = await this.transactionManager.rebuildTransaction(decompiled);
      
      console.log('✅ Transaction processed successfully');
      return { transaction, decompiled, rebuilt };
      
    } catch (error) {
      console.error('❌ Transaction processing failed:', error);
      throw error;
    }
  }

  /**
   * Get bot status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      components: {
        heavenDEXBot: !!this.heavenDEXBot,
        tradingBot: !!this.tradingBot,
        transactionManager: !!this.transactionManager,
        analytics: !!this.analytics
      },
      timestamp: new Date()
    };
  }

  /**
   * Validate environment variables
   */
  validateEnvironment() {
    const required = [
      'HELIUS_RPC_URL',
      'WALLET_PRIVATE_KEY',
      'WALLET_PUBLIC_KEY'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Utility function to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Example usage
async function main() {
  const bot = new HeavenDEXBotMain();
  
  try {
    // Initialize the bot
    await bot.initialize();
    
    // Example: Launch a token
    const tokenConfig = {
      name: "ExampleToken",
      symbol: "EXT",
      decimals: 9,
      totalSupply: 1000000000,
      initialLiquidity: 1000,
      initialPrice: 0.001
    };
    
    // Uncomment to launch a token
    // await bot.launchToken(tokenConfig);
    
    // Example: Start trading strategy
    const strategy = {
      tokenMint: "",
      buyThreshold: 0.001,
      sellThreshold: 0.002,
      amount: 0.1,
      stopLoss: 0.0005
    };
    
    // Uncomment to start trading
    // await bot.startTradingStrategy(strategy);
    
    // Start the main bot
    await bot.start();
    
  } catch (error) {
    console.error('Bot error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Export for use in other modules
module.exports = { HeavenDEXBotMain };

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}
