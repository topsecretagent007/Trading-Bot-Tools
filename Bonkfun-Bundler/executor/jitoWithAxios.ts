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
  console.log("🚀 Starting Jito transaction execution...");

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
  console.log(`Selected Jito fee wallet: ${jitoFeeWallet.toBase58()}`);
  console.log(`Calculated fee: ${JITO_FEE / LAMPORTS_PER_SOL} SOL`);

  try {
   
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("❌ Axios request failed during Jito transaction.");
    }

    console.error("🔥 Error during transaction execution:", error);
    return { confirmed: false };
  }
};
