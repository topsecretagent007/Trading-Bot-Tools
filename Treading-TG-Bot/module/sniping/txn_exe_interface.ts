import { BlockhashWithExpiryBlockHeight, Keypair, VersionedTransaction } from '@solana/web3.js';

export interface TransactionExecutor {
  executeAndConfirm(
    transaction: VersionedTransaction,
    latestBlockHash: BlockhashWithExpiryBlockHeight,
    payer?: Keypair,
  ): Promise<{ confirmed: boolean; signature?: string, error?: string }>;
}