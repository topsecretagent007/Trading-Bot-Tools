const axios = require('axios');
const { PublicKey } = require('@solana/web3.js');
const constants = require('../utils/constants');
const Helpers = require('../utils/helpers');

/**
 * Market Data Fetcher for Heaven DEX Bot
 * Retrieves market information from various sources
 */
class MarketDataFetcher {
  constructor(config = {}) {
    this.config = {
      rpcUrl: config.rpcUrl,
      updateInterval: config.updateInterval || 30000, // 30 seconds
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 10000,
      cacheTimeout: config.cacheTimeout || 60000, // 1 minute
      ...config
    };
    
    this.cache = new Map();
    this.subscribers = new Map();
    this.isRunning = false;
    this.updateTimer = null;
  }

  /**
   * Start market data fetching
   */
  start() {
    if (this.isRunning) {
      console.log('Market data fetcher is already running');
      return;
    }

    console.log('🚀 Starting market data fetcher...');
    this.isRunning = true;
    
    // Initial fetch
    this.fetchAllMarketData();
    
    // Set up periodic updates
    this.updateTimer = setInterval(() => {
      this.fetchAllMarketData();
    }, this.config.updateInterval);
  }

  /**
   * Stop market data fetching
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping market data fetcher...');
    this.isRunning = false;
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Fetch all market data
   */
  async fetchAllMarketData() {
    try {
      const promises = [
        this.fetchSolanaPrice(),
        this.fetchMarketOverview(),
        this.fetchTrendingTokens()
      ];

      const results = await Promise.allSettled(promises);
      
      // Process results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`✅ Market data ${index + 1} fetched successfully`);
        } else {
          console.error(`❌ Market data ${index + 1} failed:`, result.reason);
        }
      });

      // Notify subscribers
      this.notifySubscribers();
      
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  }

  /**
   * Fetch SOL price from multiple sources
   * @returns {Promise<Object>} - SOL price data
   */
  async fetchSolanaPrice() {
    try {
      const sources = [
        this.fetchFromCoinGecko(),
        this.fetchFromCoinMarketCap(),
        this.fetchFromBinance()
      ];

      const results = await Promise.allSettled(sources);
      const validResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      if (validResults.length === 0) {
        throw new Error('No valid SOL price sources available');
      }

      // Calculate average price
      const totalPrice = validResults.reduce((sum, result) => sum + result.price, 0);
      const averagePrice = totalPrice / validResults.length;

      const solData = {
        price: averagePrice,
        change24h: validResults[0]?.change24h || 0,
        volume24h: validResults[0]?.volume24h || 0,
        marketCap: validResults[0]?.marketCap || 0,
        sources: validResults.length,
        timestamp: Date.now()
      };

      this.cache.set('solana', solData);
      return solData;
      
    } catch (error) {
      console.error('Error fetching SOL price:', error.message);
      throw error;
    }
  }

  /**
   * Fetch from CoinGecko
   * @returns {Promise<Object>} - Price data
   */
  async fetchFromCoinGecko() {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true',
        { timeout: this.config.timeout }
      );

      const data = response.data.solana;
      return {
        price: data.usd,
        change24h: data.usd_24h_change || 0,
        volume24h: data.usd_24h_vol || 0,
        marketCap: data.usd_market_cap || 0,
        source: 'coingecko'
      };
    } catch (error) {
      throw new Error(`CoinGecko: ${error.message}`);
    }
  }

  /**
   * Fetch from CoinMarketCap
   * @returns {Promise<Object>} - Price data
   */
  async fetchFromCoinMarketCap() {
    try {
      // Note: CoinMarketCap requires API key
      // This is a simplified implementation
      const response = await axios.get(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SOL',
        {
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || 'demo'
          },
          timeout: this.config.timeout
        }
      );

      const data = response.data.data.SOL.quote.USD;
      return {
        price: data.price,
        change24h: data.percent_change_24h || 0,
        volume24h: data.volume_24h || 0,
        marketCap: data.market_cap || 0,
        source: 'coinmarketcap'
      };
    } catch (error) {
      throw new Error(`CoinMarketCap: ${error.message}`);
    }
  }

  /**
   * Fetch from Binance
   * @returns {Promise<Object>} - Price data
   */
  async fetchFromBinance() {
    try {
      const response = await axios.get(
        'https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT',
        { timeout: this.config.timeout }
      );

      const data = response.data;
      return {
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        volume24h: parseFloat(data.volume) * parseFloat(data.lastPrice),
        marketCap: 0, // Binance doesn't provide market cap
        source: 'binance'
      };
    } catch (error) {
      throw new Error(`Binance: ${error.message}`);
    }
  }

  /**
   * Fetch market overview
   * @returns {Promise<Object>} - Market overview data
   */
  async fetchMarketOverview() {
    try {
      const overview = {
        totalMarketCap: 0,
        totalVolume24h: 0,
        marketDominance: {
          bitcoin: 0,
          ethereum: 0,
          solana: 0
        },
        fearGreedIndex: await this.fetchFearGreedIndex(),
        timestamp: Date.now()
      };

      this.cache.set('marketOverview', overview);
      return overview;
      
    } catch (error) {
      console.error('Error fetching market overview:', error.message);
      throw error;
    }
  }

  /**
   * Fetch Fear & Greed Index
   * @returns {Promise<number>} - Fear & Greed Index value
   */
  async fetchFearGreedIndex() {
    try {
      const response = await axios.get(
        'https://api.alternative.me/fng/',
        { timeout: this.config.timeout }
      );

      const data = response.data.data[0];
      return parseInt(data.value);
    } catch (error) {
      console.warn('Could not fetch Fear & Greed Index:', error.message);
      return 50; // Neutral value
    }
  }

  /**
   * Fetch trending tokens
   * @returns {Promise<Array>} - Trending tokens data
   */
  async fetchTrendingTokens() {
    try {
      const trending = [
        {
          symbol: 'SOL',
          name: 'Solana',
          price: 0,
          change24h: 0,
          volume24h: 0,
          marketCap: 0
        }
        // Add more trending tokens as needed
      ];

      this.cache.set('trendingTokens', trending);
      return trending;
      
    } catch (error) {
      console.error('Error fetching trending tokens:', error.message);
      throw error;
    }
  }

  /**
   * Fetch token market data
   * @param {string} tokenMint - Token mint address
   * @returns {Promise<Object>} - Token market data
   */
  async fetchTokenMarketData(tokenMint) {
    try {
      // Check cache first
      const cacheKey = `token_${tokenMint}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached;
      }

      // Fetch from Heaven DEX (this would be the actual implementation)
      const tokenData = await this.fetchFromHeavenDEX(tokenMint);
      
      // Cache the data
      this.cache.set(cacheKey, {
        ...tokenData,
        timestamp: Date.now()
      });

      return tokenData;
      
    } catch (error) {
      console.error(`Error fetching token market data for ${tokenMint}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch from Heaven DEX
   * @param {string} tokenMint - Token mint address
   * @returns {Promise<Object>} - Token data
   */
  async fetchFromHeavenDEX(tokenMint) {
    try {
      // This is a mock implementation
      // In reality, you'd fetch from Heaven DEX's actual API
      const mockData = {
        price: 0.001 + Math.random() * 0.002,
        volume24h: 1000 + Math.random() * 5000,
        liquidity: 5000 + Math.random() * 10000,
        marketCap: 10000 + Math.random() * 50000,
        holders: 100 + Math.random() * 900,
        transactions24h: 50 + Math.random() * 150,
        source: 'heavendex'
      };

      return mockData;
      
    } catch (error) {
      throw new Error(`Heaven DEX: ${error.message}`);
    }
  }

  /**
   * Get cached market data
   * @param {string} key - Cache key
   * @returns {Object|null} - Cached data or null
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if data is still valid
    if (Date.now() - cached.timestamp > this.config.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Subscribe to market data updates
   * @param {string} event - Event type
   * @param {Function} callback - Callback function
   * @returns {string} - Subscription ID
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Map());
    }

    const subscriptionId = Helpers.generateUniqueId();
    this.subscribers.get(event).set(subscriptionId, callback);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from market data updates
   * @param {string} event - Event type
   * @param {string} subscriptionId - Subscription ID
   */
  unsubscribe(event, subscriptionId) {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.delete(subscriptionId);
    }
  }

  /**
   * Notify subscribers of market data updates
   */
  notifySubscribers() {
    for (const [event, subscribers] of this.subscribers) {
      const data = this.getCachedData(event);
      if (data) {
        subscribers.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in subscriber callback for ${event}:`, error);
          }
        });
      }
    }
  }

  /**
   * Get market data statistics
   * @returns {Object} - Statistics object
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      updateInterval: this.config.updateInterval,
      cacheSize: this.cache.size,
      subscribers: Array.from(this.subscribers.keys()).map(event => ({
        event,
        count: this.subscribers.get(event)?.size || 0
      })),
      lastUpdate: this.getLastUpdateTime()
    };
  }

  /**
   * Get last update time
   * @returns {Date|null} - Last update time
   */
  getLastUpdateTime() {
    let latestTime = null;
    
    for (const [key, data] of this.cache) {
      if (!latestTime || data.timestamp > latestTime) {
        latestTime = data.timestamp;
      }
    }
    
    return latestTime ? new Date(latestTime) : null;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Market data cache cleared');
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Market data fetcher configuration updated');
  }
}

module.exports = { MarketDataFetcher };
