require('dotenv').config();
const { HeavenDEXBotMain } = require('../src/index');

/**
 * Basic usage example for Heaven DEX Bot
 */
async function basicUsage() {
  console.log('🚀 Heaven DEX Bot - Basic Usage Example\n');
  
  const bot = new HeavenDEXBotMain();
  
  try {
    // Initialize the bot
    console.log('1. Initializing bot...');
    await bot.initialize();
    console.log('✅ Bot initialized successfully\n');
    
    // Get bot status
    console.log('2. Bot status:');
    const status = bot.getStatus();
    console.log(JSON.stringify(status, null, 2));
    console.log();
    
    // Example: Launch a token (commented out for safety)
    console.log('3. Example token launch configuration:');
    const tokenConfig = {
      name: "MyAwesomeToken",
      symbol: "MAT",
      decimals: 9,
      totalSupply: 1000000000,
      initialLiquidity: 1000, // SOL
      initialPrice: 0.001 // SOL per token
    };
    console.log(JSON.stringify(tokenConfig, null, 2));
    console.log();
    
    // Example: Trading strategy configuration
    console.log('4. Example trading strategy:');
    const strategy = {
      tokenMint: "",
      buyThreshold: 0.001, // Buy when price drops below 0.001 SOL
      sellThreshold: 0.002, // Sell when price rises above 0.002 SOL
      amount: 0.1, // Trade with 0.1 SOL
      stopLoss: 0.0005, // Stop loss at 0.0005 SOL
      checkInterval: 30000, // Check every 30 seconds
      minVolume: 100, // Minimum volume requirement
      minLiquidity: 1000 // Minimum liquidity requirement
    };
    console.log(JSON.stringify(strategy, null, 2));
    console.log();
    
    // Example: Process a transaction
    console.log('5. Example transaction processing:');
    const exampleTx = "5pf2idtpBmwDujUfCpAW2s7Mw6oSbbq7rSzKT1HNTN16o6acmjzT3t3qq51N3GHvBmWu3e3Pg9MhMfXZpHbLNVym";
    console.log(`Transaction signature: ${exampleTx}`);
    console.log('This would process the transaction and decompile it using LUTs');
    console.log();
    
    // Start monitoring (this will run until interrupted)
    console.log('6. Starting bot monitoring...');
    console.log('Press Ctrl+C to stop the bot\n');
    
    await bot.start();
    
  } catch (error) {
    console.error('❌ Error in basic usage example:', error);
  }
}

/**
 * Custom trading strategy example
 */
class CustomTradingStrategy extends require('../src/StrategyBuilder') {
  constructor() {
    super({
      buyThreshold: 0.0008,
      sellThreshold: 0.0015,
      stopLoss: 0.0004,
      baseAmount: 0.05,
      maxAmount: 0.5,
      trailingStop: true,
      trailingStopDistance: 0.05,
      dca: true,
      dcaInterval: 1800000 // 30 minutes
    });
  }
  
  async shouldBuy(tokenData) {
    // Custom buy logic: buy on volume spikes
    const baseDecision = await super.shouldBuy(tokenData);
    
    if (!baseDecision) return false;
    
    // Additional condition: buy when volume is 50% above average
    if (tokenData.volume > tokenData.averageVolume * 1.5) {
      console.log('📈 Volume spike detected, buying...');
      return true;
    }
    
    return false;
  }
  
  async shouldSell(tokenData) {
    // Custom sell logic: sell on momentum loss
    const baseDecision = await super.shouldSell(tokenData);
    
    if (baseDecision) return true;
    
    // Additional condition: sell when price momentum is negative
    if (tokenData.priceChange && tokenData.priceChange < -0.1) {
      console.log('📉 Negative momentum detected, selling...');
      return true;
    }
    
    return false;
  }
}

/**
 * Run the examples
 */
async function runExamples() {
  console.log('🎯 Heaven DEX Bot Examples\n');
  
  // Run basic usage
  await basicUsage();
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

module.exports = { basicUsage, CustomTradingStrategy };
