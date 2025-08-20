import { Connection, VersionedTransaction } from "@solana/web3.js";
import { RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT } from "../constants";

interface Blockhash {
  blockhash: string;
  lastValidBlockHeight: number;
}

export const execute = async (transaction: VersionedTransaction, latestBlockhash: Blockhash, isBuy: boolean | 1 = true) => {
  console.log("🚀 Starting legacy transaction execution for Bags.fm...");
  
  const solanaConnection = new Connection(RPC_ENDPOINT, {
    wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
  });

  try {
    console.log("📤 Sending transaction to Solana network...");
    const signature = await solanaConnection.sendRawTransaction(transaction.serialize(), { 
      skipPreflight: true,
      maxRetries: 3
    });
    
    console.log("🔗 Transaction sent, signature:", signature);
    console.log("⏳ Waiting for confirmation...");

    const confirmation = await solanaConnection.confirmTransaction(
      {
        signature,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        blockhash: latestBlockhash.blockhash,
      },
      "confirmed"
    );

    if (confirmation.value.err) {
      console.error("❌ Transaction confirmation error:", confirmation.value.err);
      return "";
    } else {
      if (isBuy === 1) {
        console.log("✅ Transaction confirmed successfully!");
        return signature;
      } else if (isBuy) {
        console.log(`✅ Buy transaction successful: https://solscan.io/tx/${signature}`);
      } else {
        console.log(`✅ Sell transaction successful: https://solscan.io/tx/${signature}`);
      }
    }
    
    return signature;
  } catch (error) {
    console.error("💥 Error during legacy transaction execution:", error);
    return "";
  }
}
