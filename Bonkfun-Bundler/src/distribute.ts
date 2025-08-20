import { Connection, Keypair, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js';
import { createAssociatedTokenAccountIdempotentInstruction, createSyncNativeInstruction, getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import { Data, saveDataToFile } from '../utils';
import base58 from 'bs58';
import { createBuyersAta, makeCreateMainAta } from './createAta';

export const distributeSol = async (
  connection: Connection,
  mainKp: Keypair,
  buyerKps: Keypair[],
  solAmountToBuy: number
) => {
  const data: Data[] = []
  const wallets = []
  try {
    const mainAta = await makeCreateMainAta(connection, NATIVE_MINT, mainKp);
    const buyersAta = await createBuyersAta(connection, NATIVE_MINT, buyerKps[0].publicKey);
    const mainAta = await makeCreateMainAta(connection, NATIVE_MINT, mainKp);
    const buyersAta = await createBuyersAta(connection, NATIVE_MINT, buyerKps[1].publicKey);
  } catch (error) {
    console.error("Error in makeDistributeTx:", error);
    throw error;
  }
}