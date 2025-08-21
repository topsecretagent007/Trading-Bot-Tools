import { AppConfig, DeveloperInfo, SolanaConfig, HeavenDexConfig, IPFSConfig, LoggingConfig } from '../types';

// Developer information for TopSecretAgent007
export const DEVELOPER_INFO: DeveloperInfo = {
  name: "TopSecretAgent007",
  telegram: "@topsecretagent_007",
  twitter: "@lendon1114",
  github: "@topsecretagent007",
  description: "Blockchain Developer & DeFi Enthusiast"
} as const;

// Solana configuration
export const SOLANA_CONFIG: SolanaConfig = {
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  commitment: 'confirmed',
  network: (process.env.SOLANA_NETWORK as any) || 'mainnet-beta'
};

// Heaven DEX configuration
export const HEAVEN_DEX_CONFIG: HeavenDexConfig = {
  programId: process.env.HEAVEN_DEX_PROGRAM_ID || '',
  marketAddress: process.env.HEAVEN_DEX_MARKET_ADDRESS || '',
  feeRate: 0.003, // 0.3% fee
  slippageTolerance: 0.005 // 0.5% slippage
};

// IPFS configuration
export const IPFS_CONFIG: IPFSConfig = {
  gateway: 'https://ipfs.io/ipfs/',
  pinataApiKey: process.env.PINATA_API_KEY || '',
  pinataSecretKey: process.env.PINATA_SECRET_KEY || ''
};

// Logging configuration
export const LOGGING_CONFIG: LoggingConfig = {
  level: (process.env.LOG_LEVEL as any) || 'info',
  enableEmojis: true,
  enableTimestamps: true
};

// Main application configuration
export const CONFIG: AppConfig = {
  name: 'Heaven DEX Token Launchpad Bot',
  version: '1.0.0',
  description: 'A lightweight DeFi project built on Solana for creating tokens and performing token swaps using Heaven DEX',
  developer: DEVELOPER_INFO,
  solana: SOLANA_CONFIG,
  heavenDex: HEAVEN_DEX_CONFIG,
  ipfs: IPFS_CONFIG,
  logging: LOGGING_CONFIG
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

// Configuration getters
export const getSolanaConfig = (): SolanaConfig => CONFIG.solana;
export const getHeavenDexConfig = (): HeavenDexConfig => CONFIG.heavenDex;
export const getIPFSConfig = (): IPFSConfig => CONFIG.ipfs;
export const getLoggingConfig = (): LoggingConfig => CONFIG.logging;
export const getDeveloperInfo = (): DeveloperInfo => CONFIG.developer;

// Export default configuration
export default CONFIG;
