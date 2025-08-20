import { Connection, Commitment } from '@solana/web3.js';
import { RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT } from '../constants/constants';

// Bags.fm specific configuration
export const BAGS_FM_CONFIG = {
  // Program IDs
  PROGRAM_ID: "BAGSRzq3QTeQ1f7BsAkf6e5Qw49HkQLbz2Xbfz7eQLVV",
  AUTHORITY: "4Bu96XjU84XjPDSpveTVf6LYGCkfW5FK7SNkREWcEfV4",
  
  // Trading parameters
  DEFAULT_SLIPPAGE: 0.01, // 1%
  MIN_TRADE_AMOUNT: 0.0001, // 0.0001 SOL
  MAX_TRADE_AMOUNT: 1.0, // 1 SOL
  
  // Transaction parameters
  COMPUTE_UNIT_PRICE: 100_000, // Micro-lamports per compute unit
  COMPUTE_UNIT_LIMIT: 1_000_000, // Maximum compute units
  MAX_TRANSACTION_SIZE: 1232, // Maximum transaction size in bytes
  
  // Jito MEV protection
  JITO_FEE: 0.001, // 0.001 SOL
  JITO_ENDPOINTS: [
    "https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles",
    "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles",
    "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles",
  ],
  
  // RPC configuration
  COMMITMENT: "confirmed" as Commitment,
  CONFIRMATION_TIMEOUT: 60000, // 60 seconds
  MAX_RETRIES: 3,
};

// Initialize Solana connection
export const initSolanaConnection = (): Connection => {
  return new Connection(RPC_ENDPOINT, {
    wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
    commitment: BAGS_FM_CONFIG.COMMITMENT,
  });
};

// Validate configuration
export const validateConfig = (): boolean => {
  try {
    if (!RPC_ENDPOINT) {
      throw new Error("RPC_ENDPOINT is not configured");
    }
    
    if (!BAGS_FM_CONFIG.PROGRAM_ID) {
      throw new Error("BAGS_FM_PROGRAM_ID is not configured");
    }
    
    if (!BAGS_FM_CONFIG.AUTHORITY) {
      throw new Error("BAGS_FM_AUTHORITY is not configured");
    }
    
    console.log("✅ Configuration validation passed");
    return true;
  } catch (error) {
    console.error("❌ Configuration validation failed:", error);
    return false;
  }
};

// Get environment-specific configuration
export const getEnvironmentConfig = () => {
  const isDevnet = RPC_ENDPOINT.includes('devnet');
  const isTestnet = RPC_ENDPOINT.includes('testnet');
  
  return {
    isDevnet,
    isTestnet,
    isMainnet: !isDevnet && !isTestnet,
    network: isDevnet ? 'devnet' : isTestnet ? 'testnet' : 'mainnet'
  };
};



