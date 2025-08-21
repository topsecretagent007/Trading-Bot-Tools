import { HeavenTokenLaunchpadBot } from './HeavenTokenLaunchpadBot';

/**
 * Main entry point for the Heaven DEX Token Launchpad Bot
 */
async function main() {
  try {
    // Create and start the bot
    const bot = new HeavenTokenLaunchpadBot();
    await bot.start();
    
  } catch (error) {
    console.error('❌ Fatal error in main application:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main();
}

// Barrel exports for all components and utilities
export { HeavenTokenLaunchpadBot } from './HeavenTokenLaunchpadBot';
export { TokenCreator } from './components/TokenCreator';
export { TokenTrader } from './components/TokenTrader';
export { TokenManager } from './components/TokenManager';
export * from './types';
export * from './config';
export * from './utils/helpers';
