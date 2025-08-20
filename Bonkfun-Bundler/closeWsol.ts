import { createAssociatedTokenAccountIdempotentInstruction, createCloseAccountInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ComputeBudgetProgram, Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { connection } from "./utils/config";
import { sendAndConfirmTransaction } from "@solana/web3.js";
import { sleep } from "./utils";
import { PRIVATE_KEY } from "./constants";
import bs58 from "bs58";

const mainKp = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
const baseMint = NATIVE_MINT
/**
 * Wraps the given amount of SOL into WSOL.
 * @param {Keypair} mainKp - The central keypair which holds SOL.
 * @param {number} wsolAmount - The amount of SOL to wrap.
 */
const wrapSol = async (mainKp: Keypair, wsolAmount: number) => {
  try {

  } catch (error) {
    // console.error("wrapSol error:", error);
  }
};

/**
 * Unwraps WSOL into SOL.
 * @param {Keypair} mainKp - The main keypair.
 */
const unwrapSol = async (mainKp: Keypair) => {
  const wSolAccount = await getAssociatedTokenAddress(NATIVE_MINT, mainKp.publicKey);
  try {

  } catch (error) {
    // console.error("unwrapSol error:", error);
  }
};


unwrapSol(mainKp)