import { Connection } from '@solana/web3.js';
import { CONFIG, validateEnvironment } from './config';
import { TokenCreator } from './components/TokenCreator';
import { TokenTrader } from './components/TokenTrader';
import { TokenManager } from './components/TokenManager';
import { sleep } from './utils/helpers';
import { CreateTokenResult, TradeResult } from './types';

export class HeavenTokenLaunchpadBot {
  private connection: Connection;
  private tokenCreator: TokenCreator;
  private tokenTrader: TokenTrader;
  private tokenManager: TokenManager;

  constructor() {
    // Validate environment variables
    validateEnvironment();
    
    // Initialize Solana connection
    this.connection = new Connection(CONFIG.solana.rpcUrl, CONFIG.solana.commitment);
    
    // Initialize components
    this.tokenCreator = new TokenCreator(this.connection);
    this.tokenTrader = new TokenTrader(this.connection);
    this.tokenManager = new TokenManager(this.connection);
  }

  /**
   * Starts the bot and runs the complete token lifecycle
   */
  async start(): Promise<void> {
    try {
      this.displayStartupBanner();
      
      // 1️⃣ Create Token
      const createResult = await this.createTokenStep();
      if (!createResult) {
        throw new Error('❌ Token creation failed');
      }

      await sleep(2000);

      // 2️⃣ Buy Token
      const buyResult = await this.buyTokenStep(createResult.mint);
      if (!buyResult?.success) {
        throw new Error('❌ Buy transaction failed');
      }

      await sleep(2000);

      // 3️⃣ Sell Token
      const sellResult = await this.sellTokenStep(createResult.mint);
      if (!sellResult?.success) {
        throw new Error('❌ Sell transaction failed');
      }

      // 4️⃣ Display Results
      await this.displayResults(createResult, buyResult, sellResult);

      console.log('\n' + '='.repeat(60) + '\n');
      console.log('🎉 Token lifecycle completed successfully!');
      console.log('🚀 Heaven DEX Token Launchpad Bot finished!');
      
    } catch (error) {
      console.error('❌ Error in main workflow:', error);
      process.exit(1);
    }
  }

  /**
   * Displays the startup banner with developer information
   */
  private displayStartupBanner(): void {
    console.log('🚀 Starting Heaven DEX Token Launchpad Bot...');
    console.log('👨‍💻 Developer: TopSecretAgent007');
    console.log('📱 Telegram: @topsecretagent_007');
    console.log('🐦 Twitter: @lendon1114');
    console.log('🐙 GitHub: @topsecretagent007');
    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Step 1: Creates a new token
   */
  private async createTokenStep(): Promise<CreateTokenResult | null> {
    console.log('🪙 Step 1: Creating new token...');
    
    const createResult = await this.tokenCreator.createCustomToken(
      'Heaven Token',
      'HEAVEN',
      'A revolutionary token created with Heaven DEX Token Launchpad Bot',
      'https://ipfs.io/ipfs/your-image-hash',
      9
    );

    if (createResult) {
      console.log(`✅ Token created successfully!`);
      console.log(`📍 Mint Address: ${createResult.mint.toBase58()}`);
      console.log(`🏦 Token Account: ${createResult.tokenAccount.toBase58()}`);
      console.log(`📋 Token Name: ${createResult.metadata.name}`);
      console.log(`🔤 Symbol: ${createResult.metadata.symbol}`);
    }

    return createResult;
  }

  /**
   * Step 2: Buys tokens
   */
  private async buyTokenStep(mint: any): Promise<TradeResult | null> {
    console.log('\n💰 Step 2: Buying tokens...');
    
    const buyResult = await this.tokenTrader.buyToken(mint, 0.005);
    
    if (buyResult?.success) {
      console.log('✅ Buy transaction completed successfully!');
      if (buyResult.tokenAmount) {
        console.log(`🎯 Tokens received: ${buyResult.tokenAmount.toFixed(6)}`);
      }
    }

    return buyResult;
  }

  /**
   * Step 3: Sells tokens
   */
  private async sellTokenStep(mint: any): Promise<TradeResult | null> {
    console.log('\n💸 Step 3: Selling tokens...');
    
    const sellResult = await this.tokenTrader.sellToken(mint, 1000);
    
    if (sellResult?.success) {
      console.log('✅ Sell transaction completed successfully!');
      if (sellResult.solAmount) {
        console.log(`💎 SOL received: ${sellResult.solAmount.toFixed(6)}`);
      }
    }

    return sellResult;
  }

  /**
   * Displays comprehensive results
   */
  private async displayResults(
    createResult: CreateTokenResult,
    buyResult: TradeResult,
    sellResult: TradeResult
  ): Promise<void> {
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('📊 COMPREHENSIVE RESULTS SUMMARY');
    console.log('='.repeat(60));

    // Token Information
    console.log('\n🪙 TOKEN INFORMATION:');
    console.log(`   Name: ${createResult.metadata.name}`);
    console.log(`   Symbol: ${createResult.metadata.symbol}`);
    console.log(`   Mint Address: ${createResult.mint.toBase58()}`);
    console.log(`   Token Account: ${createResult.tokenAccount.toBase58()}`);
    console.log(`   Decimals: ${createResult.decimals}`);
    console.log(`   Created: ${createResult.createdAt}`);

    // Buy Transaction
    if (buyResult?.success) {
      console.log('\n💰 BUY TRANSACTION:');
      console.log(`   Type: ${buyResult.type}`);
      console.log(`   Amount: ${buyResult.amount} SOL`);
      if (buyResult.tokenAmount) {
        console.log(`   Tokens Received: ${buyResult.tokenAmount.toFixed(6)}`);
      }
      if (buyResult.transactionHash) {
        console.log(`   Transaction: ${buyResult.transactionHash}`);
      }
      console.log(`   Timestamp: ${buyResult.timestamp}`);
    }

    // Sell Transaction
    if (sellResult?.success) {
      console.log('\n💸 SELL TRANSACTION:');
      console.log(`   Type: ${sellResult.type}`);
      console.log(`   Amount: ${sellResult.amount} tokens`);
      if (sellResult.solAmount) {
        console.log(`   SOL Received: ${sellResult.solAmount.toFixed(6)}`);
      }
      if (sellResult.transactionHash) {
        console.log(`   Transaction: ${sellResult.transactionHash}`);
      }
      console.log(`   Timestamp: ${sellResult.timestamp}`);
    }

    // Get additional token information
    try {
      const metadata = await this.tokenManager.getTokenMetadata(createResult.mint);
      if (metadata) {
        console.log('\n📋 TOKEN METADATA:');
        console.log(`   Description: ${metadata.description}`);
        console.log(`   Website: ${metadata.website}`);
        console.log(`   Developer: ${metadata.developer}`);
        console.log(`   Total Supply: ${metadata.totalSupply.toLocaleString()}`);
        console.log(`   Market Cap: ${metadata.marketCap} SOL`);
        console.log(`   Current Price: ${metadata.price} SOL`);
      }
    } catch (error) {
      console.log('\n⚠️  Could not retrieve additional metadata');
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Gets the Solana connection
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Gets the token creator component
   */
  getTokenCreator(): TokenCreator {
    return this.tokenCreator;
  }

  /**
   * Gets the token trader component
   */
  getTokenTrader(): TokenTrader {
    return this.tokenTrader;
  }

  /**
   * Gets the token manager component
   */
  getTokenManager(): TokenManager {
    return this.tokenManager;
  }
}
