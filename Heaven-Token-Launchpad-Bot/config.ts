import { DEVELOPER_INFO } from './type';

// Project Configuration
export const CONFIG = {
  // Project Info
  name: 'Heaven DEX Token Launchpad Bot',
  version: '1.0.0',
  description: 'A lightweight DeFi project built on Solana for creating tokens and performing token swaps using Heaven DEX',
  
  // Developer Information
  developer: DEVELOPER_INFO,
  
  // Solana Configuration
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    commitment: 'confirmed' as const,
    network: process.env.SOLANA_NETWORK || 'mainnet-beta'
  },
  
  // Heaven DEX Configuration
  heavenDex: {
    programId: process.env.HEAVEN_DEX_PROGRAM_ID || '',
    marketAddress: process.env.HEAVEN_DEX_MARKET_ADDRESS || '',
    feeRate: 0.003 // 0.3% fee
  },
  
  // Token Configuration
  token: {
    defaultDecimals: 9,
    defaultMetadata: {
      name: 'Heaven Token',
      symbol: 'HEAVEN',
      description: 'Token created with Heaven DEX Token Launchpad Bot',
      image: 'https://ipfs.io/ipfs/your-image-hash',
      website: 'https://heaven-dex.com',
      twitter: DEVELOPER_INFO.twitter,
      telegram: DEVELOPER_INFO.telegram,
      github: DEVELOPER_INFO.github
    }
  },
  
  // IPFS Configuration (for metadata storage)
  ipfs: {
    gateway: 'https://ipfs.io/ipfs/',
    pinataApiKey: process.env.PINATA_API_KEY || '',
    pinataSecretKey: process.env.PINATA_SECRET_KEY || ''
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableEmojis: true,
    enableTimestamps: true
  }
} as const;

// Environment variables validation
export const validateEnvironment = (): void => {
  const requiredEnvVars = [
    'SOLANA_RPC_URL',
    'HEAVEN_DEX_PROGRAM_ID',
    'HEAVEN_DEX_MARKET_ADDRESS'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Warning: The following environment variables are not set:');
    missingVars.forEach(varName => console.warn(`   - ${varName}`));
    console.warn('   Using default values. For production, please set all required environment variables.');
  }
};

// Export default configuration
export default CONFIG;
