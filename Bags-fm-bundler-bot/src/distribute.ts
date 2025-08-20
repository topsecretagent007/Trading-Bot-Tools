import { Connection, Keypair, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js';
import { createAssociatedTokenAccountIdempotentInstruction, createSyncNativeInstruction, getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import { Data, saveDataToFile } from '../utils';
import base58 from 'bs58';

export const distributeSol = async (
  connection: Connection,
  mainKp: Keypair,
  buyerKps: Keypair[],
  solAmountToBuy: number
) => {
  const data: Data[] = []
  const wallets = []
  try {
    // Add extra SOL for fees and rent (0.001 SOL extra per wallet)
    const extraAmount = 8_000_000; // 0.001 SOL in lamports for fees and rent
    const transferAmount = solAmountToBuy + extraAmount; // 0.006 SOL per transfer (0.005 + 0.001)
    const totalRequired = buyerKps.length * transferAmount;
    const balance = await connection.getBalance(mainKp.publicKey);
    console.log("🚀 ~ balance:", balance)
    console.log("🚀 ~ totalRequired:", totalRequired)

    return { signature };
  } catch (error) {
    console.error("Error in makeDistributeTx:", error);
    throw error;
  }
}