import { PublicKey } from '@solana/web3.js';

// Basic token metadata interface
export interface TokenMetadata {
  name: string;
  symbol: string;
  image: string;
  description: string;
  createdOn: string;
  twitter?: string;
  website?: string;
  telegram?: string;
  github?: string;
  developer?: string;
}

// Extended token information
export interface TokenInfo extends TokenMetadata {
  mint: string;
  decimals: number;
  totalSupply: number;
  circulatingSupply: number;
  marketCap: number;
  price: number;
}

// Token creation result
export interface CreateTokenResult {
  mint: PublicKey;
  tokenAccount: PublicKey;
  metadata: TokenMetadata;
  metadataUri: string;
  decimals: number;
  createdAt: string;
}

// Token balance information
export interface TokenBalance {
  mint: string;
  owner: string;
  balance: number;
  decimals: number;
  tokenAccount: string;
  lastUpdated: string;
}

// Trade types
export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL'
}

// Trade result
export interface TradeResult {
  success: boolean;
  type: TradeType;
  mint: string;
  amount: number;
  tokenAmount?: number;
  solAmount?: number;
  transactionHash?: string;
  error?: string;
  timestamp: string;
}

// Heaven DEX specific types
export interface HeavenDexConfig {
  programId: string;
  marketAddress: string;
  feeRate: number;
  slippageTolerance: number;
}

// Solana connection configuration
export interface SolanaConfig {
  rpcUrl: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
  network: 'mainnet-beta' | 'testnet' | 'devnet';
}

// IPFS configuration
export interface IPFSConfig {
  gateway: string;
  pinataApiKey: string;
  pinataSecretKey: string;
}

// Logging configuration
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableEmojis: boolean;
  enableTimestamps: boolean;
}

// Main configuration interface
export interface AppConfig {
  name: string;
  version: string;
  description: string;
  developer: DeveloperInfo;
  solana: SolanaConfig;
  heavenDex: HeavenDexConfig;
  ipfs: IPFSConfig;
  logging: LoggingConfig;
}

// Developer information
export interface DeveloperInfo {
  name: string;
  telegram: string;
  twitter: string;
  github: string;
  description: string;
}

// Token launchpad configuration
export interface LaunchpadConfig {
  defaultDecimals: number;
  defaultMetadata: TokenMetadata;
  maxSupply: number;
  minSupply: number;
}

// Transaction status
export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Transaction information
export interface TransactionInfo {
  signature: string;
  status: TransactionStatus;
  blockTime: number;
  fee: number;
  error?: string;
}

// Market data
export interface MarketData {
  mint: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holders: number;
  lastUpdated: string;
}

// Portfolio summary
export interface PortfolioSummary {
  totalValue: number;
  totalTokens: number;
  totalSOL: number;
  tokens: PortfolioToken[];
  lastUpdated: string;
}

// Portfolio token
export interface PortfolioToken {
  mint: string;
  name: string;
  symbol: string;
  balance: number;
  value: number;
  price: number;
  priceChange24h: number;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Success response
export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// Error response
export interface ErrorResponse {
  success: false;
  error: AppError;
}

// Generic API response
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
