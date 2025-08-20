import {
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  createInitializeMint2Instruction,
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
} from "@solana/spl-token";

import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";

import { initSdk } from "../utils/config";
import { DEV_LAUNCHPAD_PROGRAM, findProgramAddress, getPdaLaunchpadConfigId, LAUNCHPAD_POOL_SEED, LAUNCHPAD_PROGRAM, LaunchpadConfig, ProgramAddress, TxVersion } from "@raydium-io/raydium-sdk-v2";
import { BN } from "bn.js";
import { JITO_FEE } from "../constants";

export const createMints = async (connection: Connection, mainKp: Keypair): Promise<Keypair> => {
  try {
    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    const keypair = Keypair.generate()
    const programId = TOKEN_PROGRAM_ID

    const sig = await sendAndConfirmTransaction(connection, transaction, [mainKp, keypair]);
    return keypair;
  } catch (err) {
    console.log("create mint error ====>", err)
    throw new Error("Failed to create mint");
  }
}

export const createTokenTx = async (connection: Connection, mainKp: Keypair, mintKp: Keypair) => {
  try {
    // Initialize SDK
    const raydium = await initSdk(mainKp.publicKey);

    // Get config info
    const configId = getPdaLaunchpadConfigId(LAUNCHPAD_PROGRAM, NATIVE_MINT, 0, 0).publicKey;
    const configData = await connection.getAccountInfo(configId);

    if (!configData) {
      throw new Error('Config not found');
    }

    return transaction;
  } catch (error) {
    console.error("createTokenTx error:", error);
    throw error;
  }
}

