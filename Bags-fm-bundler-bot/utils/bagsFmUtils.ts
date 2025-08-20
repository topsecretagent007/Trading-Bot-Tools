import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import { BAGS_FM_CONFIG } from './config';

// Bags.fm specific utility functions

/**
 * Calculate the optimal trade amount based on current market conditions
 */
export const calculateOptimalTradeAmount = (
  baseAmount: number,
  slippage: number = BAGS_FM_CONFIG.DEFAULT_SLIPPAGE
): number => {
  const adjustedAmount = baseAmount * (1 - slippage);
  return Math.max(adjustedAmount, BAGS_FM_CONFIG.MIN_TRADE_AMOUNT);
};

/**
 * Validate a Bags.fm token address
 */
export const isValidBagsFmToken = (tokenAddress: string): boolean => {
  try {
    const pubkey = new PublicKey(tokenAddress);
    return PublicKey.isOnCurve(pubkey);
  } catch {
    return false;
  }
};

/**
 * Get Bags.fm pool information
 */
export const getBagsFmPoolInfo = async (
  connection: Connection,
  tokenMint: PublicKey,
  baseMint: PublicKey = new PublicKey('So11111111111111111111111111111111111111112') // WSOL
): Promise<{
  poolAddress: PublicKey;
  poolAuthority: PublicKey;
  poolVault: PublicKey;
}> => {
  // This is a placeholder - you'll need to implement actual pool derivation
  // based on Bags.fm's program structure
  const poolAddress = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), tokenMint.toBuffer(), baseMint.toBuffer()],
    new PublicKey(BAGS_FM_CONFIG.PROGRAM_ID)
  )[0];

  const poolAuthority = new PublicKey(BAGS_FM_CONFIG.AUTHORITY);
  
  const poolVault = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), poolAddress.toBuffer()],
    new PublicKey(BAGS_FM_CONFIG.PROGRAM_ID)
  )[0];

  return {
    poolAddress,
    poolAuthority,
    poolVault
  };
};

/**
 * Calculate transaction priority fee
 */
export const calculatePriorityFee = (
  baseFee: number = BAGS_FM_CONFIG.COMPUTE_UNIT_PRICE,
  networkCongestion: number = 1.0
): number => {
  return Math.floor(baseFee * networkCongestion);
};

/**
 * Format SOL amount for display
 */
export const formatSolAmount = (lamports: number): string => {
  const sol = lamports / 1e9;
  return `${sol.toFixed(6)} SOL`;
};

/**
 * Format token amount for display
 */
export const formatTokenAmount = (amount: number, decimals: number = 6): string => {
  const tokenAmount = amount / Math.pow(10, decimals);
  return `${tokenAmount.toFixed(decimals)}`;
};

/**
 * Generate a unique transaction ID
 */
export const generateTransactionId = (): string => {
  return `bags_fm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate wallet balance for trading
 */
export const validateWalletBalance = (
  balance: number,
  requiredAmount: number,
  buffer: number = 0.001 // 0.001 SOL buffer
): boolean => {
  const requiredWithBuffer = requiredAmount + (buffer * 1e9);
  return balance >= requiredWithBuffer;
};

/**
 * Get Bags.fm program authority
 */
export const getBagsFmAuthority = (): PublicKey => {
  return new PublicKey(BAGS_FM_CONFIG.AUTHORITY);
};

/**
 * Check if transaction size is within limits
 */
export const isTransactionSizeValid = (size: number): boolean => {
  return size <= BAGS_FM_CONFIG.MAX_TRANSACTION_SIZE;
};

/**
 * Log Bags.fm specific information
 */
export const logBagsFmInfo = (): void => {
  console.log("🏷️  Bags.fm Configuration:");
  console.log(`   Program ID: ${BAGS_FM_CONFIG.PROGRAM_ID}`);
  console.log(`   Authority: ${BAGS_FM_CONFIG.AUTHORITY}`);
  console.log(`   Default Slippage: ${BAGS_FM_CONFIG.DEFAULT_SLIPPAGE * 100}%`);
  console.log(`   Min Trade Amount: ${BAGS_FM_CONFIG.MIN_TRADE_AMOUNT} SOL`);
  console.log(`   Max Trade Amount: ${BAGS_FM_CONFIG.MAX_TRADE_AMOUNT} SOL`);
  console.log(`   Jito Fee: ${BAGS_FM_CONFIG.JITO_FEE} SOL`);
  console.log(`   Max Transaction Size: ${BAGS_FM_CONFIG.MAX_TRANSACTION_SIZE} bytes`);
};
