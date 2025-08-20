import { Connection, Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import { cluster, connection } from "../config";


interface Blockhash {
  blockhash: string;
  lastValidBlockHeight: number;
}


export const executeVersionedTx = async (transaction: VersionedTransaction) => {
  const latestBlockhash = await connection.getLatestBlockhash()
  const signature = await connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true })


  return signature
}


export const executeLegacyTx = async (transaction: Transaction, signer: Keypair[], latestBlockhash: Blockhash) => {

  
  return signature
}
