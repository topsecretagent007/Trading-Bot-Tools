const fs = require('fs');
const path = require('path');
const constants = require('../utils/constants');

/**
 * Logger component for Heaven DEX Bot
 * Handles different log levels and file output
 */
class Logger {
  constructor(config = {}) {
    this.config = {
      level: config.level || constants.LOGGING.DEFAULT_LEVEL,
      logToFile: config.logToFile !== false,
      logFile: config.logFile || constants.LOGGING.logFile,
      maxFileSize: config.maxFileSize || constants.LOGGING.MAX_FILE_SIZE,
      maxFiles: config.maxFiles || constants.LOGGING.MAX_FILES,
      dateFormat: config.dateFormat || constants.LOGGING.DATE_FORMAT,
      ...config
    };
    
    this.logLevels = constants.LOGGING.LEVELS;
    this.currentLevel = this.logLevels[this.config.level.toUpperCase()] || this.logLevels.INFO;
    
    // Ensure log directory exists
    if (this.config.logToFile) {
      this.ensureLogDirectory();
    }
  }

  /**
   * Log message with specified level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  log(level, message, data = {}) {
    const levelNum = this.logLevels[level.toUpperCase()];
    
    if (levelNum === undefined || levelNum > this.currentLevel) {
      return;
    }

    const timestamp = this.formatTimestamp(new Date());
    const logEntry = this.formatLogEntry(level, message, data, timestamp);
    
    // Console output
    this.outputToConsole(level, logEntry);
    
    // File output
    if (this.config.logToFile) {
      this.outputToFile(logEntry);
    }
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or additional data
   */
  error(message, error = {}) {
    let data = {};
    
    if (error instanceof Error) {
      data = {
        error: error.message,
        stack: error.stack,
        name: error.name
      };
    } else if (typeof error === 'object') {
      data = error;
    }
    
    this.log('error', message, data);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} data - Additional data
   */
  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} data - Additional data
   */
  info(message, data = {}) {
    this.log('info', message, data);
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} data - Additional data
   */
  debug(message, data = {}) {
    this.log('debug', message, data);
  }

  /**
   * Log trace message
   * @param {string} message - Trace message
   * @param {Object} data - Additional data
   */
  trace(message, data = {}) {
    this.log('trace', message, data);
  }

  /**
   * Log trade information
   * @param {Object} trade - Trade data
   */
  logTrade(trade) {
    const { type, amount, price, tokenMint, timestamp } = trade;
    
    this.info(`Trade ${type.toUpperCase()}`, {
      tradeType: type,
      amount,
      price,
      tokenMint,
      timestamp,
      profit: trade.profit || 0
    });
  }

  /**
   * Log bot status
   * @param {Object} status - Bot status
   */
  logBotStatus(status) {
    this.info('Bot Status Update', {
      isRunning: status.isRunning,
      components: status.components,
      timestamp: status.timestamp
    });
  }

  /**
   * Log transaction information
   * @param {Object} transaction - Transaction data
   */
  logTransaction(transaction) {
    const { signature, status, fee, blockTime } = transaction;
    
    this.info('Transaction Processed', {
      signature,
      status,
      fee,
      blockTime,
      timestamp: Date.now()
    });
  }

  /**
   * Log performance metrics
   * @param {Object} metrics - Performance metrics
   */
  logPerformance(metrics) {
    this.info('Performance Metrics', {
      ...metrics,
      timestamp: Date.now()
    });
  }

  /**
   * Format log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} timestamp - Timestamp
   * @returns {string} - Formatted log entry
   */
  formatLogEntry(level, message, data, timestamp) {
    const levelUpper = level.toUpperCase().padEnd(5);
    const dataStr = Object.keys(data).length > 0 ? ` | ${JSON.stringify(data)}` : '';
    
    return `[${timestamp}] ${levelUpper} | ${message}${dataStr}`;
  }

  /**
   * Output to console with colors
   * @param {string} level - Log level
   * @param {string} logEntry - Formatted log entry
   */
  outputToConsole(level, logEntry) {
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[35m', // Magenta
      trace: '\x1b[37m'  // White
    };
    
    const reset = '\x1b[0m';
    const color = colors[level] || '';
    
    console.log(`${color}${logEntry}${reset}`);
  }

  /**
   * Output to file
   * @param {string} logEntry - Formatted log entry
   */
  outputToFile(logEntry) {
    try {
      const logPath = path.resolve(this.config.logFile);
      const logDir = path.dirname(logPath);
      
      // Ensure log directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Check file size and rotate if necessary
      this.rotateLogFileIfNeeded(logPath);
      
      // Append log entry
      fs.appendFileSync(logPath, logEntry + '\n');
    } catch (error) {
      console.error('Error writing to log file:', error.message);
    }
  }

  /**
   * Rotate log file if it exceeds max size
   * @param {string} logPath - Log file path
   */
  rotateLogFileIfNeeded(logPath) {
    try {
      if (!fs.existsSync(logPath)) {
        return;
      }
      
      const stats = fs.statSync(logPath);
      if (stats.size < this.config.maxFileSize) {
        return;
      }
      
      // Rotate existing log files
      for (let i = this.config.maxFiles - 1; i > 0; i--) {
        const oldFile = `${logPath}.${i}`;
        const newFile = `${logPath}.${i + 1}`;
        
        if (fs.existsSync(oldFile)) {
          if (i === this.config.maxFiles - 1) {
            fs.unlinkSync(oldFile);
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }
      
      // Rename current log file
      fs.renameSync(logPath, `${logPath}.1`);
      
      console.log('📁 Log file rotated');
    } catch (error) {
      console.error('Error rotating log file:', error.message);
    }
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    try {
      const logDir = path.dirname(this.config.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating log directory:', error.message);
    }
  }

  /**
   * Format timestamp
   * @param {Date} date - Date object
   * @returns {string} - Formatted timestamp
   */
  formatTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Set log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    const newLevel = this.logLevels[level.toUpperCase()];
    if (newLevel !== undefined) {
      this.currentLevel = newLevel;
      this.config.level = level.toLowerCase();
      this.info(`Log level changed to ${level.toUpperCase()}`);
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * Get current log level
   * @returns {string} - Current log level
   */
  getLevel() {
    return this.config.level;
  }

  /**
   * Check if level is enabled
   * @param {string} level - Log level to check
   * @returns {boolean} - True if enabled
   */
  isLevelEnabled(level) {
    const levelNum = this.logLevels[level.toUpperCase()];
    return levelNum !== undefined && levelNum <= this.currentLevel;
  }

  /**
   * Get log file info
   * @returns {Object} - Log file information
   */
  getLogFileInfo() {
    try {
      const logPath = path.resolve(this.config.logFile);
      
      if (!fs.existsSync(logPath)) {
        return { exists: false, size: 0, modified: null };
      }
      
      const stats = fs.statSync(logPath);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        path: logPath
      };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }

  /**
   * Clear log file
   */
  clearLogFile() {
    try {
      const logPath = path.resolve(this.config.logFile);
      if (fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, '');
        this.info('Log file cleared');
      }
    } catch (error) {
      this.error('Error clearing log file', error);
    }
  }

  /**
   * Get logger statistics
   * @returns {Object} - Logger statistics
   */
  getStats() {
    return {
      level: this.config.level,
      currentLevel: this.currentLevel,
      logToFile: this.config.logToFile,
      logFile: this.config.logFile,
      maxFileSize: this.config.maxFileSize,
      maxFiles: this.config.maxFiles,
      logFileInfo: this.getLogFileInfo()
    };
  }
}

module.exports = { Logger };
