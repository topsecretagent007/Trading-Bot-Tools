const { PublicKey } = require('@solana/web3.js');
const constants = require('./constants');

/**
 * Validation utilities for the Heaven DEX Bot
 */
class Validators {
  /**
   * Validate token configuration
   * @param {Object} config - Token configuration
   * @returns {Object} - Validation result
   */
  static validateTokenConfig(config) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!config.name) {
      errors.push('Token name is required');
    } else if (typeof config.name !== 'string') {
      errors.push('Token name must be a string');
    } else if (config.name.length < constants.TOKEN.MIN_NAME_LENGTH) {
      errors.push(`Token name must be at least ${constants.TOKEN.MIN_NAME_LENGTH} characters`);
    } else if (config.name.length > constants.TOKEN.MAX_NAME_LENGTH) {
      errors.push(`Token name must be at most ${constants.TOKEN.MAX_NAME_LENGTH} characters`);
    }

    if (!config.symbol) {
      errors.push('Token symbol is required');
    } else if (typeof config.symbol !== 'string') {
      errors.push('Token symbol must be a string');
    } else if (config.symbol.length < constants.TOKEN.MIN_SYMBOL_LENGTH) {
      errors.push(`Token symbol must be at least ${constants.TOKEN.MIN_SYMBOL_LENGTH} characters`);
    } else if (config.symbol.length > constants.TOKEN.MAX_SYMBOL_LENGTH) {
      errors.push(`Token symbol must be at most ${constants.TOKEN.MAX_SYMBOL_LENGTH} characters`);
    }

    // Decimals validation
    if (typeof config.decimals !== 'number') {
      errors.push('Token decimals must be a number');
    } else if (config.decimals < constants.TOKEN.MIN_DECIMALS) {
      errors.push(`Token decimals must be at least ${constants.TOKEN.MIN_DECIMALS}`);
    } else if (config.decimals > constants.TOKEN.MAX_DECIMALS) {
      errors.push(`Token decimals must be at most ${constants.TOKEN.MAX_DECIMALS}`);
    }

    // Total supply validation
    if (typeof config.totalSupply !== 'number') {
      errors.push('Total supply must be a number');
    } else if (config.totalSupply < constants.TOKEN.MIN_SUPPLY) {
      errors.push(`Total supply must be at least ${constants.TOKEN.MIN_SUPPLY}`);
    } else if (config.totalSupply > constants.TOKEN.MAX_SUPPLY) {
      errors.push(`Total supply must be at most ${constants.TOKEN.MAX_SUPPLY}`);
    }

    // Initial liquidity validation
    if (typeof config.initialLiquidity !== 'number') {
      errors.push('Initial liquidity must be a number');
    } else if (config.initialLiquidity < constants.TRADING.MIN_AMOUNT) {
      errors.push(`Initial liquidity must be at least ${constants.TRADING.MIN_AMOUNT} SOL`);
    }

    // Initial price validation
    if (typeof config.initialPrice !== 'number') {
      errors.push('Initial price must be a number');
    } else if (config.initialPrice <= 0) {
      errors.push('Initial price must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate trading strategy configuration
   * @param {Object} strategy - Trading strategy
   * @returns {Object} - Validation result
   */
  static validateTradingStrategy(strategy) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!strategy.tokenMint) {
      errors.push('Token mint address is required');
    } else if (!this.isValidSolanaAddress(strategy.tokenMint)) {
      errors.push('Invalid token mint address');
    }

    // Threshold validation
    if (typeof strategy.buyThreshold !== 'number') {
      errors.push('Buy threshold must be a number');
    } else if (strategy.buyThreshold <= 0) {
      errors.push('Buy threshold must be greater than 0');
    }

    if (typeof strategy.sellThreshold !== 'number') {
      errors.push('Sell threshold must be a number');
    } else if (strategy.sellThreshold <= 0) {
      errors.push('Sell threshold must be greater than 0');
    }

    if (strategy.buyThreshold >= strategy.sellThreshold) {
      errors.push('Buy threshold must be lower than sell threshold');
    }

    // Stop loss validation
    if (strategy.stopLoss !== undefined) {
      if (typeof strategy.stopLoss !== 'number') {
        errors.push('Stop loss must be a number');
      } else if (strategy.stopLoss <= 0) {
        errors.push('Stop loss must be greater than 0');
      } else if (strategy.stopLoss >= strategy.buyThreshold) {
        errors.push('Stop loss must be lower than buy threshold');
      }
    }

    // Amount validation
    if (strategy.amount !== undefined) {
      if (typeof strategy.amount !== 'number') {
        errors.push('Amount must be a number');
      } else if (strategy.amount < constants.TRADING.MIN_AMOUNT) {
        errors.push(`Amount must be at least ${constants.TRADING.MIN_AMOUNT} SOL`);
      } else if (strategy.amount > constants.TRADING.MAX_AMOUNT) {
        errors.push(`Amount must be at most ${constants.TRADING.MAX_AMOUNT} SOL`);
      }
    }

    // Check interval validation
    if (strategy.checkInterval !== undefined) {
      if (typeof strategy.checkInterval !== 'number') {
        errors.push('Check interval must be a number');
      } else if (strategy.checkInterval < constants.STRATEGY.MIN_CHECK_INTERVAL) {
        errors.push(`Check interval must be at least ${constants.STRATEGY.MIN_CHECK_INTERVAL}ms`);
      } else if (strategy.checkInterval > constants.STRATEGY.MAX_CHECK_INTERVAL) {
        errors.push(`Check interval must be at most ${constants.STRATEGY.MAX_CHECK_INTERVAL}ms`);
      }
    }

    // Cooldown validation
    if (strategy.cooldownPeriod !== undefined) {
      if (typeof strategy.cooldownPeriod !== 'number') {
        errors.push('Cooldown period must be a number');
      } else if (strategy.cooldownPeriod < constants.STRATEGY.MIN_COOLDOWN) {
        errors.push(`Cooldown period must be at least ${constants.STRATEGY.MIN_COOLDOWN}ms`);
      } else if (strategy.cooldownPeriod > constants.STRATEGY.MAX_COOLDOWN) {
        errors.push(`Cooldown period must be at most ${constants.STRATEGY.MAX_COOLDOWN}ms`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate wallet configuration
   * @param {Object} config - Wallet configuration
   * @returns {Object} - Validation result
   */
  static validateWalletConfig(config) {
    const errors = [];
    const warnings = [];

    // Private key validation
    if (!config.privateKey) {
      errors.push('Private key is required');
    } else if (typeof config.privateKey !== 'string') {
      errors.push('Private key must be a string');
    } else if (config.privateKey.length < 64) {
      errors.push('Private key must be at least 64 characters');
    }

    // Public key validation
    if (!config.publicKey) {
      errors.push('Public key is required');
    } else if (!this.isValidSolanaAddress(config.publicKey)) {
      errors.push('Invalid public key address');
    }

    // Balance validation
    if (config.minBalance !== undefined) {
      if (typeof config.minBalance !== 'number') {
        errors.push('Minimum balance must be a number');
      } else if (config.minBalance < 0) {
        errors.push('Minimum balance must be non-negative');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate network configuration
   * @param {Object} config - Network configuration
   * @returns {Object} - Validation result
   */
  static validateNetworkConfig(config) {
    const errors = [];
    const warnings = [];

    // RPC URL validation
    if (!config.rpcUrl) {
      errors.push('RPC URL is required');
    } else if (typeof config.rpcUrl !== 'string') {
      errors.push('RPC URL must be a string');
    } else if (!this.isValidUrl(config.rpcUrl)) {
      errors.push('Invalid RPC URL format');
    }

    // Network type validation
    if (config.network) {
      const validNetworks = Object.values(constants.NETWORK);
      if (!validNetworks.includes(config.network)) {
        errors.push(`Invalid network type. Must be one of: ${validNetworks.join(', ')}`);
      }
    }

    // Commitment validation
    if (config.commitment) {
      const validCommitments = ['processed', 'confirmed', 'finalized'];
      if (!validCommitments.includes(config.commitment)) {
        errors.push(`Invalid commitment level. Must be one of: ${validCommitments.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate transaction configuration
   * @param {Object} config - Transaction configuration
   * @returns {Object} - Validation result
   */
  static validateTransactionConfig(config) {
    const errors = [];
    const warnings = [];

    // Retry validation
    if (config.maxRetries !== undefined) {
      if (typeof config.maxRetries !== 'number') {
        errors.push('Max retries must be a number');
      } else if (config.maxRetries < 0) {
        errors.push('Max retries must be non-negative');
      } else if (config.maxRetries > constants.TRANSACTION.MAX_RETRIES) {
        errors.push(`Max retries must be at most ${constants.TRANSACTION.MAX_RETRIES}`);
      }
    }

    // Timeout validation
    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number') {
        errors.push('Timeout must be a number');
      } else if (config.timeout < 1000) {
        errors.push('Timeout must be at least 1000ms');
      }
    }

    // Gas limit validation
    if (config.gasLimit !== undefined) {
      if (typeof config.gasLimit !== 'number') {
        errors.push('Gas limit must be a number');
      } else if (config.gasLimit <= 0) {
        errors.push('Gas limit must be greater than 0');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate market data
   * @param {Object} data - Market data
   * @returns {Object} - Validation result
   */
  static validateMarketData(data) {
    const errors = [];
    const warnings = [];

    // Price validation
    if (typeof data.price !== 'number') {
      errors.push('Price must be a number');
    } else if (data.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    // Volume validation
    if (data.volume !== undefined) {
      if (typeof data.volume !== 'number') {
        errors.push('Volume must be a number');
      } else if (data.volume < 0) {
        errors.push('Volume must be non-negative');
      }
    }

    // Liquidity validation
    if (data.liquidity !== undefined) {
      if (typeof data.liquidity !== 'number') {
        errors.push('Liquidity must be a number');
      } else if (data.liquidity < 0) {
        errors.push('Liquidity must be non-negative');
      }
    }

    // Timestamp validation
    if (data.timestamp !== undefined) {
      if (!(data.timestamp instanceof Date) && typeof data.timestamp !== 'number') {
        errors.push('Timestamp must be a Date object or number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
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
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate numeric range
   * @param {number} value - Value to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean} - True if valid
   */
  static isInRange(value, min, max) {
    return typeof value === 'number' && value >= min && value <= max;
  }

  /**
   * Validate required fields
   * @param {Object} obj - Object to validate
   * @param {Array} requiredFields - Array of required field names
   * @returns {Object} - Validation result
   */
  static validateRequiredFields(obj, requiredFields) {
    const errors = [];
    const warnings = [];

    for (const field of requiredFields) {
      if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
        errors.push(`Field '${field}' is required`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate object structure
   * @param {Object} obj - Object to validate
   * @param {Object} schema - Schema definition
   * @returns {Object} - Validation result
   */
  static validateObjectStructure(obj, schema) {
    const errors = [];
    const warnings = [];

    for (const [key, rules] of Object.entries(schema)) {
      const value = obj[key];

      // Check if field is required
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`Field '${key}' is required`);
        continue;
      }

      // Skip validation if field is not present and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push(`Field '${key}' must be of type ${rules.type}`);
      }

      // Length validation for strings
      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push(`Field '${key}' must be at least ${rules.minLength} characters long`);
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`Field '${key}' must be at most ${rules.maxLength} characters long`);
      }

      // Range validation for numbers
      if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        errors.push(`Field '${key}' must be at least ${rules.min}`);
      }

      if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        errors.push(`Field '${key}' must be at most ${rules.max}`);
      }

      // Custom validation function
      if (rules.validate && typeof rules.validate === 'function') {
        try {
          const customValidation = rules.validate(value);
          if (!customValidation.isValid) {
            errors.push(...customValidation.errors);
            warnings.push(...customValidation.warnings);
          }
        } catch (error) {
          errors.push(`Custom validation failed for field '${key}': ${error.message}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = Validators;
