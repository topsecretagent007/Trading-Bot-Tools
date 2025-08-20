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
    const wSolAccount = await getAssociatedTokenAddress(NATIVE_MINT, mainKp.publicKey);
    const baseAta = await getAssociatedTokenAddress(baseMint, mainKp.publicKey);
    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: 51_337 }),
    );
    if (!await connection.getAccountInfo(wSolAccount))
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          mainKp.publicKey,
          wSolAccount,
          mainKp.publicKey,
          NATIVE_MINT,
        ),
        SystemProgram.transfer({
          fromPubkey: mainKp.publicKey,
          toPubkey: wSolAccount,
          lamports: Math.floor(wsolAmount * 10 ** 9),
        }),
        createSyncNativeInstruction(wSolAccount, TOKEN_PROGRAM_ID),
      )
    if (!await connection.getAccountInfo(baseAta))
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          mainKp.publicKey,
          baseAta,
          mainKp.publicKey,
          baseMint,
        ),
      )

    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    tx.feePayer = mainKp.publicKey
    // console.log("Wrap simulation: ", await connection.simulateTransaction(tx))
    const sig = await sendAndConfirmTransaction(connection, tx, [mainKp], { skipPreflight: true, commitment: "confirmed" });
    console.log(`Wrapped SOL transaction: https://solscan.io/tx/${sig}`);
    await sleep(5000);
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
    const wsolAccountInfo = await connection.getAccountInfo(wSolAccount);
    if (wsolAccountInfo) {
      const tx = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
        ComputeBudgetProgram.setComputeUnitLimit({ units: 101337 }),
        createCloseAccountInstruction(
          wSolAccount,
          mainKp.publicKey,
          mainKp.publicKey,
        ),
      );
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      tx.feePayer = mainKp.publicKey
      const sig = await sendAndConfirmTransaction(connection, tx, [mainKp], { skipPreflight: true, commitment: "confirmed" });
      console.log(`Unwrapped SOL transaction: https://solscan.io/tx/${sig}`);
      await sleep(5000);
    }
  } catch (error) {
    // console.error("unwrapSol error:", error);
  }
};


unwrapSol(mainKp)