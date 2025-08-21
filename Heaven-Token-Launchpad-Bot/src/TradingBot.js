const { Connection, PublicKey, Keypair, Transaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token');

class TradingBot {
  constructor(config) {
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    this.wallet = Keypair.fromSecretKey(Buffer.from(config.walletKey, 'base64'));
    this.config = config;
    this.isRunning = false;
    this.currentStrategy = null;
    this.tradeHistory = [];
  }

  /**
   * Start a trading strategy
   * @param {Object} strategy - Trading strategy configuration
   */
  async startStrategy(strategy) {
    try {
      console.log('🤖 Starting trading strategy...');
      
      this.currentStrategy = strategy;
      this.isRunning = true;
      
      // Validate strategy parameters
      this.validateStrategy(strategy);
      
      // Start monitoring loop
      await this.monitoringLoop();
      
    } catch (error) {
      console.error('❌ Failed to start trading strategy:', error);
      throw error;
    }
  }

  /**
   * Stop the trading bot
   */
  stopStrategy() {
    console.log('🛑 Stopping trading strategy...');
    this.isRunning = false;
    this.currentStrategy = null;
  }

  /**
   * Main monitoring loop
   */
  async monitoringLoop() {
    while (this.isRunning) {
      try {
        // Get current token data
        const tokenData = await this.getTokenData(this.currentStrategy.tokenMint);
        
        // Check if we should buy
        if (await this.shouldBuy(tokenData)) {
          await this.executeBuy(tokenData);
        }
        
        // Check if we should sell
        if (await this.shouldSell(tokenData)) {
          await this.executeSell(tokenData);
        }
        
        // Wait before next check
        await this.sleep(this.currentStrategy.checkInterval || 30000); // Default 30 seconds
        
      } catch (error) {
        console.error('Error in monitoring loop:', error);
        await this.sleep(10000); // Wait 10 seconds on error
      }
    }
  }

  /**
   * Check if we should buy tokens
   */
  async shouldBuy(tokenData) {
    const strategy = this.currentStrategy;
    
    // Check if price is below buy threshold
    if (tokenData.price > strategy.buyThreshold) {
      return false;
    }
    
    // Check if we have enough SOL
    const solBalance = await this.getSolBalance();
    if (solBalance < strategy.amount) {
      console.log('💰 Insufficient SOL balance for buy');
      return false;
    }
    
    // Check if volume is sufficient
    if (tokenData.volume < (strategy.minVolume || 0)) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if we should sell tokens
   */
  async shouldSell(tokenData) {
    const strategy = this.currentStrategy;
    
    // Check if price is above sell threshold
    if (tokenData.price >= strategy.sellThreshold) {
      return true;
    }
    
    // Check stop loss
    if (tokenData.price <= strategy.stopLoss) {
      console.log('🛑 Stop loss triggered');
      return true;
    }
    
    return false;
  }

  /**
   * Execute a buy order
   */
  async executeBuy(tokenData) {
    try {
      console.log('🟢 Executing buy order...');
      
      const strategy = this.currentStrategy;
      const amount = await this.calculateAmount(tokenData);
      
      // Get token balance to check if we already own some
      const tokenBalance = await this.getTokenBalance(strategy.tokenMint);
      
      if (tokenBalance > 0) {
        console.log('📈 Already holding tokens, averaging down...');
      }
      
      // Execute the buy transaction (simplified)
      const buyResult = await this.simulateBuy(amount, tokenData.price);
      
      // Record the trade
      this.recordTrade({
        type: 'BUY',
        amount: amount,
        price: tokenData.price,
        timestamp: new Date(),
        tx: buyResult.tx
      });
      
      console.log('✅ Buy order executed successfully');
      
    } catch (error) {
      console.error('❌ Buy order failed:', error);
    }
  }

  /**
   * Execute a sell order
   */
  async executeSell(tokenData) {
    try {
      console.log('🔴 Executing sell order...');
      
      const strategy = this.currentStrategy;
      const tokenBalance = await this.getTokenBalance(strategy.tokenMint);
      
      if (tokenBalance <= 0) {
        console.log('📉 No tokens to sell');
        return;
      }
      
      // Execute the sell transaction (simplified)
      const sellResult = await this.simulateSell(tokenBalance, tokenData.price);
      
      // Record the trade
      this.recordTrade({
        type: 'SELL',
        amount: tokenBalance,
        price: tokenData.price,
        timestamp: new Date(),
        tx: sellResult.tx
      });
      
      console.log('✅ Sell order executed successfully');
      
    } catch (error) {
      console.error('❌ Sell order failed:', error);
    }
  }

  /**
   * Calculate trade amount based on strategy
   */
  async calculateAmount(tokenData) {
    const strategy = this.currentStrategy;
    
    // Simple fixed amount strategy
    if (strategy.amount) {
      return Math.min(strategy.amount, await this.getSolBalance());
    }
    
    // Percentage-based strategy
    if (strategy.percentage) {
      const solBalance = await this.getSolBalance();
      return solBalance * (strategy.percentage / 100);
    }
    
    // Dynamic sizing based on volatility
    if (strategy.dynamicSizing) {
      const baseAmount = strategy.baseAmount || 0.1;
      const volatility = tokenData.volatility || 1;
      return Math.min(baseAmount * volatility, strategy.maxAmount || 1.0);
    }
    
    return 0.1; // Default amount
  }

  /**
   * Get current token data
   */
  async getTokenData(tokenMint) {
    try {
      // This is a simplified version - in reality, you'd fetch from Heaven DEX API
      const mockData = {
        price: 0.001 + Math.random() * 0.002, // Random price between 0.001 and 0.003
        volume: 1000 + Math.random() * 5000,  // Random volume
        marketCap: 10000 + Math.random() * 50000,
        volatility: 0.5 + Math.random() * 1.5,
        timestamp: new Date()
      };
      
      return mockData;
    } catch (error) {
      console.error('Error fetching token data:', error);
      return null;
    }
  }

  /**
   * Simulate buy transaction
   */
  async simulateBuy(amount, price) {
    // This is a simplified simulation - in reality, you'd execute actual buy on Heaven DEX
    console.log(`💸 Simulating buy of ${amount} SOL worth of tokens at ${price} SOL per token`);
    
    return {
      tx: 'simulated_buy_transaction_signature',
      amount: amount,
      price: price,
      tokens: amount / price
    };
  }

  /**
   * Simulate sell transaction
   */
  async simulateSell(tokenAmount, price) {
    // This is a simplified simulation - in reality, you'd execute actual sell on Heaven DEX
    console.log(`💸 Simulating sell of ${tokenAmount} tokens at ${price} SOL per token`);
    
    return {
      tx: 'simulated_sell_transaction_signature',
      tokens: tokenAmount,
      price: price,
      sol: tokenAmount * price
    };
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenMint) {
    try {
      const mint = new PublicKey(tokenMint);
      const associatedTokenAccount = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        this.wallet.publicKey
      );
      
      const balance = await this.connection.getTokenAccountBalance(associatedTokenAccount);
      return balance.value.uiAmount || 0;
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  /**
   * Get SOL balance
   */
  async getSolBalance() {
    try {
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting SOL balance:', error);
      return 0;
    }
  }

  /**
   * Record a trade in history
   */
  recordTrade(trade) {
    this.tradeHistory.push(trade);
    console.log(`📊 Trade recorded: ${trade.type} ${trade.amount} at ${trade.price} SOL`);
  }

  /**
   * Get trading performance
   */
  getPerformance() {
    if (this.tradeHistory.length === 0) {
      return { totalTrades: 0, profit: 0, successRate: 0 };
    }
    
    const trades = this.tradeHistory;
    let totalProfit = 0;
    let successfulTrades = 0;
    
    for (let i = 0; i < trades.length; i++) {
      if (trades[i].type === 'SELL' && i > 0) {
        const buyTrade = trades[i - 1];
        if (buyTrade.type === 'BUY') {
          const profit = (trades[i].price - buyTrade.price) * buyTrade.amount;
          totalProfit += profit;
          if (profit > 0) successfulTrades++;
        }
      }
    }
    
    return {
      totalTrades: trades.length,
      profit: totalProfit,
      successRate: (successfulTrades / Math.floor(trades.length / 2)) * 100
    };
  }

  /**
   * Validate strategy parameters
   */
  validateStrategy(strategy) {
    if (!strategy.tokenMint) {
      throw new Error('Token mint address is required');
    }
    
    if (!strategy.buyThreshold || !strategy.sellThreshold) {
      throw new Error('Buy and sell thresholds are required');
    }
    
    if (strategy.buyThreshold >= strategy.sellThreshold) {
      throw new Error('Buy threshold must be lower than sell threshold');
    }
    
    if (!strategy.amount && !strategy.percentage) {
      throw new Error('Either amount or percentage must be specified');
    }
  }

  /**
   * Utility function to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { TradingBot };
