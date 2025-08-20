import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import base58 from "bs58";
import axios, { AxiosError } from "axios";
import { JITO_FEE, RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT } from "../constants";

interface Blockhash {
  blockhash: string;
  lastValidBlockHeight: number;
}

const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
  commitment: "confirmed",
});

export const jitoWithAxios = async (
  transactions: VersionedTransaction[],
  payer: Keypair
) => {
  console.log("🚀 Starting Jito transaction execution for Bags.fm...");
  console.log(`📦 Bundle contains ${transactions.length} transactions`);

  // Jito tip accounts for MEV protection
  const tipAccounts = [
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  ];

  const jitoFeeWallet = new PublicKey(
    tipAccounts[Math.floor(Math.random() * tipAccounts.length)]
  );
  console.log(`💰 Selected Jito fee wallet: ${jitoFeeWallet.toBase58()}`);
  console.log(`💸 Jito fee: ${JITO_FEE / LAMPORTS_PER_SOL} SOL`);

  try {
    // Get latest blockhash
    const latestBlockhash = await connection.getLatestBlockhash();
    console.log("🔗 Got latest blockhash:", latestBlockhash.blockhash);

    // Create Jito tip transaction
    console.log("💳 Creating Jito tip transaction...");
    const jitTipTxFeeMessage = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: jitoFeeWallet,
          lamports: JITO_FEE,
        }),
      ],
    }).compileToV0Message();

    const jitoFeeTx = new VersionedTransaction(jitTipTxFeeMessage);
    jitoFeeTx.sign([payer]);

    // Simulate the tip transaction
    console.log("🧪 Simulating Jito tip transaction...");
    const simulation = await connection.simulateTransaction(jitoFeeTx);
    if (simulation.value.err) {
      console.error("❌ Tip transaction simulation failed:", simulation.value.err);
      return { confirmed: false, error: "Tip transaction simulation failed" };
    }
    console.log("✅ Tip transaction simulation successful");

    // Get the first transaction signature for confirmation
    const firstTxSignature = base58.encode(transactions[0].signatures[0]);
    console.log("🔗 First transaction signature:", firstTxSignature);

    // Serialize all transactions for Jito
    const serializedTransactions: string[] = [];
    for (let i = 0; i < transactions.length; i++) {
      const serializedTx = base58.encode(transactions[i].serialize());
      serializedTransactions.push(serializedTx);
      console.log(`📝 Serialized transaction ${i + 1}: ${serializedTx.length} characters`);
    }

    // Jito endpoints for bundle submission
    const endpoints = [
      "https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles",
      "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles",
      "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles",
    ];

    console.log("🌐 Sending bundle to Jito endpoints...");
    const requests = endpoints.map((url, index) =>
      axios.post(url, {
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [serializedTransactions],
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch((err) => {
        console.log(`⚠️ Endpoint ${index + 1} (${url}) failed:`, err.message);
        return err;
      })
    );

    const results = await Promise.all(requests.map((p) => p.catch((e) => e)));
    const successfulResults = results.filter((result) => !(result instanceof Error));

    if (successfulResults.length > 0) {
      console.log(`✅ Bundle submitted successfully to ${successfulResults.length} endpoint(s)`);
      
      // Wait for transaction confirmation
      console.log("⏳ Waiting for transaction confirmation...");
      const confirmation = await connection.confirmTransaction(
        {
          signature: firstTxSignature,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          blockhash: latestBlockhash.blockhash,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        console.error("❌ Transaction confirmation failed:", confirmation.value.err);
        return { confirmed: false, error: "Transaction confirmation failed" };
      }

      console.log("✅ Transaction confirmed successfully!");
      console.log("🔗 Transaction signature:", firstTxSignature);
      console.log("🌐 View on Solscan: https://solscan.io/tx/" + firstTxSignature);

      return { 
        confirmed: true, 
        createAndjitoFeeTx: firstTxSignature,
        jitoFee: JITO_FEE / LAMPORTS_PER_SOL
      };
    } else {
      console.error("❌ No successful Jito response from any endpoint");
      return { confirmed: false, error: "No successful Jito response" };
    }

  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("❌ Axios request failed during Jito transaction:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
    } else {
      console.error("🔥 Unexpected error during transaction execution:", error);
    }

    return { confirmed: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};
