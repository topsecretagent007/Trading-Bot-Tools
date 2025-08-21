const { PublicKey } = require('@solana/web3.js');
const constants = require('./constants');

/**
 * Utility functions for the Heaven DEX Bot
 */
class Helpers {
  /**
   * Convert SOL to lamports
   * @param {number} sol - Amount in SOL
   * @returns {number} - Amount in lamports
   */
  static solToLamports(sol) {
    return Math.floor(sol * constants.SOLANA.LAMPORTS_PER_SOL);
  }

  /**
   * Convert lamports to SOL
   * @param {number} lamports - Amount in lamports
   * @returns {number} - Amount in SOL
   */
  static lamportsToSol(lamports) {
    return lamports / constants.SOLANA.LAMPORTS_PER_SOL;
  }

  /**
   * Format number with specified precision
   * @param {number} number - Number to format
   * @param {number} precision - Decimal precision
   * @returns {string} - Formatted number
   */
  static formatNumber(number, precision = 6) {
    if (typeof number !== 'number' || isNaN(number)) {
      return '0';
    }
    return Number(number).toFixed(precision);
  }

  /**
   * Format SOL amount with proper precision
   * @param {number} sol - SOL amount
   * @returns {string} - Formatted SOL amount
   */
  static formatSOL(sol) {
    return this.formatNumber(sol, constants.TRADING.AMOUNT_PRECISION);
  }

  /**
   * Format token price with proper precision
   * @param {number} price - Token price
   * @returns {string} - Formatted price
   */
  static formatPrice(price) {
    return this.formatNumber(price, constants.TRADING.PRICE_PRECISION);
  }

  /**
   * Calculate percentage change between two values
   * @param {number} oldValue - Old value
   * @param {number} newValue - New value
   * @returns {number} - Percentage change
   */
  static calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Calculate profit/loss percentage
   * @param {number} buyPrice - Buy price
   * @param {number} sellPrice - Sell price
   * @returns {number} - Profit/Loss percentage
   */
  static calculateProfitLoss(buyPrice, sellPrice) {
    return this.calculatePercentageChange(buyPrice, sellPrice);
  }

  /**
   * Calculate position size based on risk percentage
   * @param {number} balance - Account balance
   * @param {number} riskPercentage - Risk percentage (0-100)
   * @returns {number} - Position size
   */
  static calculatePositionSize(balance, riskPercentage) {
    const percentage = Math.min(Math.max(riskPercentage, 0), 100);
    return (balance * percentage) / 100;
  }

  /**
   * Calculate stop loss price
   * @param {number} entryPrice - Entry price
   * @param {number} stopLossPercentage - Stop loss percentage
   * @param {string} side - 'long' or 'short'
   * @returns {number} - Stop loss price
   */
  static calculateStopLoss(entryPrice, stopLossPercentage, side = 'long') {
    const percentage = stopLossPercentage / 100;
    if (side === 'long') {
      return entryPrice * (1 - percentage);
    } else {
      return entryPrice * (1 + percentage);
    }
  }

  /**
   * Calculate take profit price
   * @param {number} entryPrice - Entry price
   * @param {number} takeProfitPercentage - Take profit percentage
   * @param {string} side - 'long' or 'short'
   * @returns {number} - Take profit price
   */
  static calculateTakeProfit(entryPrice, takeProfitPercentage, side = 'long') {
    const percentage = takeProfitPercentage / 100;
    if (side === 'long') {
      return entryPrice * (1 + percentage);
    } else {
      return entryPrice * (1 - percentage);
    }
  }

  /**
   * Validate Solana address
   * @param {string} address - Address to validate
   * @returns {boolean} - True if valid
   */
  static isValidSolanaAddress(address) {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate random string
   * @param {number} length - Length of string
   * @returns {string} - Random string
   */
  static generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate unique ID
   * @returns {string} - Unique ID
   */
  static generateUniqueId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after sleep
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {Promise} - Promise that resolves with function result
   */
  static async retry(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} - Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Deep clone object
   * @param {Object} obj - Object to clone
   * @returns {Object} - Cloned object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }
    
    if (typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
  }

  /**
   * Merge objects deeply
   * @param {Object} target - Target object
   * @param {...Object} sources - Source objects
   * @returns {Object} - Merged object
   */
  static deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (this.isObject(source[key])) {
            if (!target[key]) Object.assign(target, { [key]: {} });
            this.deepMerge(target[key], source[key]);
          } else {
            Object.assign(target, { [key]: source[key] });
          }
        }
      }
    }
    
    return this.deepMerge(target, ...sources);
  }

  /**
   * Check if value is object
   * @param {any} value - Value to check
   * @returns {boolean} - True if object
   */
  static isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Get nested object property safely
   * @param {Object} obj - Object to get property from
   * @param {string} path - Property path (e.g., 'user.profile.name')
   * @param {any} defaultValue - Default value if property doesn't exist
   * @returns {any} - Property value or default
   */
  static getNestedProperty(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return defaultValue;
      }
    }
    
    return result;
  }

  /**
   * Set nested object property safely
   * @param {Object} obj - Object to set property on
   * @param {string} path - Property path (e.g., 'user.profile.name')
   * @param {any} value - Value to set
   * @returns {Object} - Modified object
   */
  static setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    for (const key of keys) {
      if (!(key in current) || !this.isObject(current[key])) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
    return obj;
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Bytes to format
   * @returns {string} - Formatted string
   */
  static formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format timestamp to readable date
   * @param {number|Date} timestamp - Timestamp or Date object
   * @returns {string} - Formatted date string
   */
  static formatTimestamp(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString();
  }

  /**
   * Calculate time difference
   * @param {number|Date} startTime - Start time
   * @param {number|Date} endTime - End time
   * @returns {Object} - Time difference object
   */
  static calculateTimeDifference(startTime, endTime) {
    const start = startTime instanceof Date ? startTime.getTime() : startTime;
    const end = endTime instanceof Date ? endTime.getTime() : endTime;
    const diff = Math.abs(end - start);
    
    return {
      milliseconds: diff,
      seconds: Math.floor(diff / 1000),
      minutes: Math.floor(diff / (1000 * 60)),
      hours: Math.floor(diff / (1000 * 60 * 60)),
      days: Math.floor(diff / (1000 * 60 * 60 * 24))
    };
  }
}

module.exports = Helpers;
