class StrategyBuilder {
  constructor(config = {}) {
    this.config = {
      // Basic thresholds
      buyThreshold: 0.001,
      sellThreshold: 0.002,
      stopLoss: 0.0005,
      
      // Position sizing
      baseAmount: 0.1,
      maxAmount: 1.0,
      percentage: null,
      
      // Risk management
      maxPositionSize: 0.5,
      maxDailyLoss: 0.1,
      maxDrawdown: 0.2,
      
      // Market conditions
      minVolume: 100,
      minLiquidity: 1000,
      maxSlippage: 5,
      
      // Timing
      checkInterval: 30000, // 30 seconds
      cooldownPeriod: 60000, // 1 minute after trade
      
      // Advanced features
      trailingStop: false,
      trailingStopDistance: 0.1,
      takeProfit: null,
      dca: false, // Dollar Cost Averaging
      dcaInterval: 3600000, // 1 hour
      
      ...config
    };
    
    this.lastTradeTime = 0;
    this.dailyPnL = 0;
    this.maxBalance = 0;
    this.trades = [];
  }

  /**
   * Check if we should buy tokens
   * Override this method in custom strategies
   */
  async shouldBuy(tokenData) {
    // Check cooldown period
    if (Date.now() - this.lastTradeTime < this.config.cooldownPeriod) {
      return false;
    }
    
    // Check daily loss limit
    if (this.dailyPnL < -this.config.maxDailyLoss) {
      console.log('🛑 Daily loss limit reached');
      return false;
    }
    
    // Check drawdown
    if (this.dailyPnL < -this.config.maxDrawdown) {
      console.log('🛑 Maximum drawdown reached');
      return false;
    }
    
    // Basic price check
    if (tokenData.price > this.config.buyThreshold) {
      return false;
    }
    
    // Volume check
    if (tokenData.volume < this.config.minVolume) {
      return false;
    }
    
    // Liquidity check
    if (tokenData.liquidity < this.config.minLiquidity) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if we should sell tokens
   * Override this method in custom strategies
   */
  async shouldSell(tokenData) {
    // Check cooldown period
    if (Date.now() - this.lastTradeTime < this.config.cooldownPeriod) {
      return false;
    }
    
    // Take profit check
    if (this.config.takeProfit && tokenData.price >= this.config.takeProfit) {
      console.log('🎯 Take profit target reached');
      return true;
    }
    
    // Stop loss check
    if (tokenData.price <= this.config.stopLoss) {
      console.log('🛑 Stop loss triggered');
      return true;
    }
    
    // Basic sell threshold
    if (tokenData.price >= this.config.sellThreshold) {
      return true;
    }
    
    // Trailing stop check
    if (this.config.trailingStop && this.shouldTrailingStop(tokenData)) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate trade amount
   * Override this method in custom strategies
   */
  async calculateAmount(tokenData, currentBalance) {
    let amount = this.config.baseAmount;
    
    // Percentage-based sizing
    if (this.config.percentage) {
      amount = currentBalance * (this.config.percentage / 100);
    }
    
    // Dynamic sizing based on volatility
    if (tokenData.volatility) {
      const volatilityMultiplier = Math.max(0.5, Math.min(2.0, 1 / tokenData.volatility));
      amount *= volatilityMultiplier;
    }
    
    // DCA logic
    if (this.config.dca && this.shouldDCA()) {
      amount *= 0.5; // Reduce position size for DCA
    }
    
    // Ensure amount doesn't exceed limits
    amount = Math.min(amount, this.config.maxAmount);
    amount = Math.min(amount, currentBalance * this.config.maxPositionSize);
    
    return amount;
  }

  /**
   * Check if trailing stop should trigger
   */
  shouldTrailingStop(tokenData) {
    if (!this.config.trailingStop || this.trades.length === 0) {
      return false;
    }
    
    const lastBuyTrade = this.trades
      .filter(trade => trade.type === 'BUY')
      .pop();
    
    if (!lastBuyTrade) return false;
    
    const priceDrop = (lastBuyTrade.price - tokenData.price) / lastBuyTrade.price;
    return priceDrop >= this.config.trailingStopDistance;
  }

  /**
   * Check if we should DCA (Dollar Cost Average)
   */
  shouldDCA() {
    if (!this.config.dca) return false;
    
    const lastTrade = this.trades[this.trades.length - 1];
    if (!lastTrade) return false;
    
    const timeSinceLastTrade = Date.now() - lastTrade.timestamp;
    return timeSinceLastTrade >= this.config.dcaInterval;
  }

  /**
   * Record a trade
   */
  recordTrade(trade) {
    this.trades.push({
      ...trade,
      timestamp: Date.now()
    });
    
    this.lastTradeTime = Date.now();
    
    // Update daily PnL
    if (trade.type === 'SELL' && this.trades.length >= 2) {
      const buyTrade = this.trades[this.trades.length - 2];
      if (buyTrade.type === 'BUY') {
        const profit = (trade.price - buyTrade.price) * buyTrade.amount;
        this.dailyPnL += profit;
      }
    }
    
    // Update max balance
    if (trade.type === 'BUY') {
      this.maxBalance = Math.max(this.maxBalance, trade.amount);
    }
  }

  /**
   * Get strategy performance metrics
   */
  getPerformance() {
    if (this.trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        maxDrawdown: 0,
        sharpeRatio: 0
      };
    }
    
    const trades = this.trades;
    let totalPnL = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let peak = 0;
    
    for (let i = 0; i < trades.length; i++) {
      if (trades[i].type === 'SELL' && i > 0) {
        const buyTrade = trades[i - 1];
        if (buyTrade.type === 'BUY') {
          const profit = (trades[i].price - buyTrade.price) * buyTrade.amount;
          totalPnL += profit;
          
          if (profit > 0) {
            winningTrades++;
          } else {
            losingTrades++;
          }
          
          // Track drawdown
          if (totalPnL > peak) {
            peak = totalPnL;
          }
          currentDrawdown = peak - totalPnL;
          maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
        }
      }
    }
    
    const totalTrades = Math.floor(trades.length / 2);
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    // Simple Sharpe ratio (assuming risk-free rate of 0)
    const sharpeRatio = totalTrades > 0 ? totalPnL / Math.sqrt(totalTrades) : 0;
    
    return {
      totalTrades,
      winRate,
      totalPnL,
      maxDrawdown,
      sharpeRatio,
      dailyPnL: this.dailyPnL
    };
  }

  /**
   * Reset daily metrics
   */
  resetDailyMetrics() {
    this.dailyPnL = 0;
    this.trades = this.trades.filter(trade => {
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return trade.timestamp > oneDayAgo;
    });
  }

  /**
   * Validate strategy configuration
   */
  validateConfig() {
    const errors = [];
    
    if (this.config.buyThreshold >= this.config.sellThreshold) {
      errors.push('Buy threshold must be lower than sell threshold');
    }
    
    if (this.config.stopLoss >= this.config.buyThreshold) {
      errors.push('Stop loss must be lower than buy threshold');
    }
    
    if (this.config.maxAmount <= 0) {
      errors.push('Max amount must be greater than 0');
    }
    
    if (this.config.checkInterval < 1000) {
      errors.push('Check interval must be at least 1000ms');
    }
    
    if (errors.length > 0) {
      throw new Error(`Strategy configuration errors: ${errors.join(', ')}`);
    }
  }

  /**
   * Get strategy summary
   */
  getSummary() {
    const performance = this.getPerformance();
    
    return {
      config: this.config,
      performance,
      lastTradeTime: this.lastTradeTime,
      maxBalance: this.maxBalance,
      isActive: Date.now() - this.lastTradeTime < this.config.cooldownPeriod
    };
  }
}

module.exports = { StrategyBuilder };
