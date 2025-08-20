import { Connection, Keypair, SignatureStatus, TransactionConfirmationStatus, TransactionInstruction, TransactionMessage, TransactionSignature, VersionedTransaction } from "@solana/web3.js";
import { DEBUG_MODE, RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT } from "../configs";

interface Blockhash {
  blockhash: string;
  lastValidBlockHeight: number;
}

export const execute = async (transaction: VersionedTransaction, latestBlockhash: Blockhash, isBuy: boolean | 1 = true) => {
  const solanaConnection = new Connection(RPC_ENDPOINT, {
    wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
  })

  const signature = await solanaConnection.sendRawTransaction(transaction.serialize(), { skipPreflight: true })
  const confirmation = await solanaConnection.confirmTransaction(
    {
      signature,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      blockhash: latestBlockhash.blockhash,
    }
  );

  if (confirmation.value.err) {
    console.log("Confirmtaion error")
    return ""
  } else {
    if (isBuy === 1) {
      return signature
    } else if (isBuy)
      console.log(`Success in buy transaction: https://solscan.io/tx/${signature}`)
    else
      console.log(`Success in Sell transaction: https://solscan.io/tx/${signature}`)
  }
  return signature
}

export const createAndSendV0Tx = async (txInstructions: TransactionInstruction[], kp: Keypair, connection: Connection) => {
  try {
    let latestBlockhash = await connection.getLatestBlockhash();
    
    const messageV0 = new TransactionMessage({
      payerKey: kp.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: txInstructions
    }).compileToV0Message();
    const transaction = new VersionedTransaction(messageV0);

    transaction.sign([kp]);
    if (DEBUG_MODE)
      console.log(await connection.simulateTransaction(transaction, {sigVerify: true}))
    const txid = await connection.sendTransaction(transaction, { skipPreflight: true });

    const confirmation = await confirmTransaction(connection, txid);

    if (DEBUG_MODE)
      console.log('LUT transaction successfully confirmed!', '\n', `https://explorer.solana.com/tx/${txid}`);
    return confirmation.err == null

  } catch (error) {
    if (DEBUG_MODE)
      console.log("Error in transaction")
    return false
  }
}

async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  desiredConfirmationStatus: TransactionConfirmationStatus = 'confirmed',
  timeout: number = 30000,
  pollInterval: number = 1000,
  searchTransactionHistory: boolean = false
): Promise<SignatureStatus> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const { value: statuses } = await connection.getSignatureStatuses([signature], { searchTransactionHistory });

    if (!statuses || statuses.length === 0) {
      throw new Error('Failed to get signature status');
    }

    const status = statuses[0];

    if (status === null) {
      // If status is null, the transaction is not yet known
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      continue;
    }

    if (status.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }

    if (status.confirmationStatus && status.confirmationStatus === desiredConfirmationStatus) {
      return status;
    }

    if (status.confirmationStatus === 'finalized') {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Transaction confirmation timeout after ${timeout}ms`);
}
