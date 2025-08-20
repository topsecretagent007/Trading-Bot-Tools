import { SYSTEM_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { getATAAddress, getPdaLaunchpadAuth, getPdaLaunchpadConfigId, getPdaLaunchpadPoolId, getPdaLaunchpadVaultId, LAUNCHPAD_PROGRAM, LaunchpadConfig } from "@raydium-io/raydium-sdk-v2";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  AddressLookupTableProgram,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";
import { BN } from "bn.js";


export const createExtendLut = async (connection: Connection, mainKp: Keypair, lookupTableAddress: PublicKey, buyerPubkeys: Array<PublicKey>, mintA: PublicKey) => {
  try {

  } catch (err) {
    console.error("createExtendLut error ====>", err);
    throw err; // Re-throw the error to handle it at a higher level
  }
}

export const createLutInst = async (connection: Connection, mainKp: Keypair, lookupTableInst: TransactionInstruction) => {
  try {

  } catch (err) {
    console.log("createLutInst error ====>", err)
  }
}




