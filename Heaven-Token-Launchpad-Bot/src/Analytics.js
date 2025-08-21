class Analytics {
  constructor() {
    this.data = {
      trades: [],
      performance: {},
      marketData: [],
      alerts: []
    };
  }

  /**
   * Generate a comprehensive trading report
   * @param {Object} options - Report options
   * @returns {Object} - Generated report
   */
  async generateReport(options = {}) {
    try {
      console.log('📊 Generating trading report...');
      
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate = new Date(),
        metrics = ['profit', 'volume', 'trades', 'success_rate'],
        format = 'json'
      } = options;
      
      // Filter data by date range
      const filteredTrades = this.data.trades.filter(trade => 
        trade.timestamp >= startDate && trade.timestamp <= endDate
      );
      
      // Calculate metrics
      const report = {
        period: {
          start: startDate,
          end: endDate,
          duration: this.calculateDuration(startDate, endDate)
        },
        summary: this.calculateSummary(filteredTrades),
        performance: this.calculatePerformanceMetrics(filteredTrades),
        risk: this.calculateRiskMetrics(filteredTrades),
        market: this.analyzeMarketData(startDate, endDate),
        recommendations: this.generateRecommendations(filteredTrades)
      };
      
      console.log('✅ Report generated successfully');
      
      return format === 'json' ? report : this.formatReport(report, format);
      
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      throw error;
    }
  }

  /**
   * Calculate basic summary statistics
   */
  calculateSummary(trades) {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        totalVolume: 0,
        totalProfit: 0,
        averageTradeSize: 0
      };
    }
    
    const totalTrades = trades.length;
    const totalVolume = trades.reduce((sum, trade) => sum + trade.amount, 0);
    const totalProfit = trades.reduce((sum, trade) => {
      if (trade.type === 'SELL' && trade.profit) {
        return sum + trade.profit;
      }
      return sum;
    }, 0);
    
    return {
      totalTrades,
      totalVolume,
      totalProfit,
      averageTradeSize: totalVolume / totalTrades
    };
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics(trades) {
    if (trades.length === 0) {
      return {
        winRate: 0,
        profitFactor: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0
      };
    }
    
    const buyTrades = trades.filter(t => t.type === 'BUY');
    const sellTrades = trades.filter(t => t.type === 'SELL');
    
    let winningTrades = 0;
    let losingTrades = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let largestWin = 0;
    let largestLoss = 0;
    
    // Calculate profit/loss for each completed trade pair
    for (let i = 0; i < Math.min(buyTrades.length, sellTrades.length); i++) {
      const buyTrade = buyTrades[i];
      const sellTrade = sellTrades[i];
      
      if (sellTrade.timestamp > buyTrade.timestamp) {
        const profit = (sellTrade.price - buyTrade.price) * buyTrade.amount;
        
        if (profit > 0) {
          winningTrades++;
          totalWins += profit;
          largestWin = Math.max(largestWin, profit);
        } else {
          losingTrades++;
          totalLosses += Math.abs(profit);
          largestLoss = Math.max(largestLoss, Math.abs(profit));
        }
      }
    }
    
    const totalTrades = winningTrades + losingTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
    const averageWin = winningTrades > 0 ? totalWins / winningTrades : 0;
    const averageLoss = losingTrades > 0 ? totalLosses / losingTrades : 0;
    
    return {
      winRate,
      profitFactor,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss
    };
  }

  /**
   * Calculate risk metrics
   */
  calculateRiskMetrics(trades) {
    if (trades.length === 0) {
      return {
        maxDrawdown: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        var95: 0
      };
    }
    
    // Calculate cumulative returns
    const returns = [];
    let cumulativeReturn = 0;
    
    for (let i = 0; i < trades.length; i++) {
      if (trades[i].type === 'SELL' && i > 0) {
        const buyTrade = trades[i - 1];
        if (buyTrade.type === 'BUY') {
          const return_ = (trades[i].price - buyTrade.price) / buyTrade.price;
          cumulativeReturn += return_;
          returns.push(return_);
        }
      }
    }
    
    if (returns.length === 0) {
      return {
        maxDrawdown: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        var95: 0
      };
    }
    
    // Calculate metrics
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;
    
    for (const return_ of returns) {
      cumulative += return_;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak - cumulative;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    // Sharpe ratio (assuming risk-free rate of 0)
    const sharpeRatio = stdDev > 0 ? meanReturn / stdDev : 0;
    
    // Sortino ratio (downside deviation)
    const downsideReturns = returns.filter(r => r < 0);
    const downsideVariance = downsideReturns.length > 0 
      ? downsideReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / downsideReturns.length 
      : 0;
    const downsideDeviation = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideDeviation > 0 ? meanReturn / downsideDeviation : 0;
    
    // Calmar ratio
    const calmarRatio = maxDrawdown > 0 ? cumulativeReturn / maxDrawdown : 0;
    
    // Value at Risk (95%)
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const varIndex = Math.floor(returns.length * 0.05);
    const var95 = sortedReturns[varIndex] || 0;
    
    return {
      maxDrawdown,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      var95
    };
  }

  /**
   * Analyze market data
   */
  analyzeMarketData(startDate, endDate) {
    const filteredMarketData = this.data.marketData.filter(data => 
      data.timestamp >= startDate && data.timestamp <= endDate
    );
    
    if (filteredMarketData.length === 0) {
      return {
        averageVolume: 0,
        averagePrice: 0,
        priceVolatility: 0,
        volumeTrend: 'stable'
      };
    }
    
    const prices = filteredMarketData.map(d => d.price);
    const volumes = filteredMarketData.map(d => d.volume);
    
    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const averageVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    
    // Calculate price volatility
    const priceVariance = prices.reduce((sum, p) => sum + Math.pow(p - averagePrice, 2), 0) / prices.length;
    const priceVolatility = Math.sqrt(priceVariance);
    
    // Determine volume trend
    const firstHalf = volumes.slice(0, Math.floor(volumes.length / 2));
    const secondHalf = volumes.slice(Math.floor(volumes.length / 2));
    const firstHalfAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    
    let volumeTrend = 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.2) volumeTrend = 'increasing';
    else if (secondHalfAvg < firstHalfAvg * 0.8) volumeTrend = 'decreasing';
    
    return {
      averageVolume,
      averagePrice,
      priceVolatility,
      volumeTrend
    };
  }

  /**
   * Generate trading recommendations
   */
  generateRecommendations(trades) {
    const recommendations = [];
    
    if (trades.length === 0) {
      recommendations.push({
        type: 'info',
        message: 'No trading data available for analysis',
        priority: 'low'
      });
      return recommendations;
    }
    
    // Analyze win rate
    const performance = this.calculatePerformanceMetrics(trades);
    if (performance.winRate < 40) {
      recommendations.push({
        type: 'warning',
        message: 'Low win rate detected. Consider reviewing entry/exit strategies.',
        priority: 'high'
      });
    }
    
    // Analyze profit factor
    if (performance.profitFactor < 1.0) {
      recommendations.push({
        type: 'warning',
        message: 'Profit factor below 1.0. Risk management may need improvement.',
        priority: 'high'
      });
    }
    
    // Analyze trade frequency
    const tradeFrequency = trades.length / this.calculateDuration(
      new Date(Math.min(...trades.map(t => t.timestamp))),
      new Date(Math.max(...trades.map(t => t.timestamp)))
    ).days;
    
    if (tradeFrequency > 10) {
      recommendations.push({
        type: 'info',
        message: 'High trading frequency detected. Consider reducing overtrading.',
        priority: 'medium'
      });
    }
    
    // Analyze position sizing
    const tradeSizes = trades.map(t => t.amount);
    const avgTradeSize = tradeSizes.reduce((sum, size) => sum + size, 0) / tradeSizes.length;
    const maxTradeSize = Math.max(...tradeSizes);
    
    if (maxTradeSize > avgTradeSize * 3) {
      recommendations.push({
        type: 'warning',
        message: 'Large position sizes detected. Consider standardizing position sizing.',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Add trade data
   */
  addTrade(trade) {
    this.data.trades.push({
      ...trade,
      timestamp: trade.timestamp || Date.now()
    });
  }

  /**
   * Add market data
   */
  addMarketData(data) {
    this.data.marketData.push({
      ...data,
      timestamp: data.timestamp || Date.now()
    });
  }

  /**
   * Add alert
   */
  addAlert(alert) {
    this.data.alerts.push({
      ...alert,
      timestamp: Date.now()
    });
  }

  /**
   * Calculate duration between dates
   */
  calculateDuration(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    
    if (diffDays > 1) {
      return { days: diffDays, hours: 0, minutes: 0 };
    } else if (diffHours > 1) {
      return { days: 0, hours: diffHours, minutes: 0 };
    } else {
      return { days: 0, hours: 0, minutes: diffMinutes };
    }
  }

  /**
   * Format report for different output types
   */
  formatReport(report, format) {
    switch (format) {
      case 'csv':
        return this.toCSV(report);
      case 'html':
        return this.toHTML(report);
      case 'text':
        return this.toText(report);
      default:
        return report;
    }
  }

  /**
   * Convert report to CSV format
   */
  toCSV(report) {
    // Implementation for CSV conversion
    return 'CSV format not implemented yet';
  }

  /**
   * Convert report to HTML format
   */
  toHTML(report) {
    // Implementation for HTML conversion
    return 'HTML format not implemented yet';
  }

  /**
   * Convert report to text format
   */
  toText(report) {
    let text = 'TRADING REPORT\n';
    text += '='.repeat(50) + '\n\n';
    
    text += `Period: ${report.period.start.toDateString()} to ${report.period.end.toDateString()}\n`;
    text += `Duration: ${report.period.duration.days} days, ${report.period.duration.hours} hours\n\n`;
    
    text += 'SUMMARY\n';
    text += '-'.repeat(20) + '\n';
    text += `Total Trades: ${report.summary.totalTrades}\n`;
    text += `Total Volume: ${report.summary.totalVolume.toFixed(4)} SOL\n`;
    text += `Total Profit: ${report.summary.totalProfit.toFixed(4)} SOL\n\n`;
    
    text += 'PERFORMANCE\n';
    text += '-'.repeat(20) + '\n';
    text += `Win Rate: ${report.performance.winRate.toFixed(2)}%\n`;
    text += `Profit Factor: ${report.performance.profitFactor.toFixed(2)}\n`;
    text += `Average Win: ${report.performance.averageWin.toFixed(4)} SOL\n`;
    text += `Average Loss: ${report.performance.averageLoss.toFixed(4)} SOL\n\n`;
    
    return text;
  }
}

module.exports = { Analytics };
