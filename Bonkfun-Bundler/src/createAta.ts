import { ComputeBudgetProgram, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  Account,
} from "@solana/spl-token";
import { DISTRIBUTE_WALLET_NUM } from "../constants";


export const makeCreateMainAta = async (connection: Connection, mint: PublicKey, mainKp: Keypair): Promise<Account> => {
  try {
    const mainAta = await getOrCreateAssociatedTokenAccount(
      connection,
      mainKp.publicKey,
      mint,
      mainKp.publicKey,
    );
    return mainAta;
  } catch (err) {
    console.log("makeCreateMainAta error ====>", err);
    throw new Error("Failed to create main ATA");
  }
}

export const createBuyersAta = async (
  mint: PublicKey,
  buyerPubkey: PublicKey,
) => {
  try {
    const buyerAta = await getOrCreateAssociatedTokenAccount(
      connection,
      buyerPubkey,
      mint,
      buyerPubkey,
    );
    return buyerAta;
  } catch (err) {
    console.log("Error in create token ata tx:", err)
  }
}




