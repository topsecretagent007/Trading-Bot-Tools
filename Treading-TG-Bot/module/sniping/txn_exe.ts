import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  Keypair,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { TransactionExecutor } from './txn_exe_interface';

export class DefaultTransactionExecutor implements TransactionExecutor {
  constructor(private readonly connection: Connection) {}

  public async executeAndConfirm(
    transaction: VersionedTransaction,
    latestBlockhash: BlockhashWithExpiryBlockHeight,
  ): Promise<{ confirmed: boolean; signature?: string, error?: string }> {
    console.log('Executing transaction...');
    const signature = await this.execute(transaction);

    console.log({ signature }, 'Confirming transaction...');
    return this.confirm(signature, latestBlockhash);
  }

  private async execute(transaction: Transaction | VersionedTransaction) {
    return this.connection.sendRawTransaction(transaction.serialize(), {
      preflightCommitment: this.connection.commitment,
    });
  }

  private async confirm(signature: string, latestBlockhash: BlockhashWithExpiryBlockHeight) {
    const confirmation = await this.connection.confirmTransaction(
      {
        signature,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        blockhash: latestBlockhash.blockhash,
      },
      this.connection.commitment,
    );

    return { confirmed: !confirmation.value.err, signature };
  }
}

export { TransactionExecutor };
