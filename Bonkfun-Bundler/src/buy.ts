import {
  TxVersion,
  getPdaLaunchpadPoolId,
  Curve,
  PlatformConfig,
  LAUNCHPAD_PROGRAM,
  buyExactInInstruction,
  getPdaLaunchpadConfigId,
  getATAAddress,
  getPdaLaunchpadAuth,
  getPdaLaunchpadVaultId,
} from '@raydium-io/raydium-sdk-v2'
import BN from 'bn.js'
import { Connection, Keypair, VersionedTransaction, TransactionMessage, ComputeBudgetProgram, PublicKey, SystemProgram } from '@solana/web3.js'
import { 
  NATIVE_MINT, 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction
} from '@solana/spl-token'
import { initSdk } from '../utils/config'
import { createBuyersAta, makeCreateMainAta } from './createAta'

export const makeBuyTx = async (connection: Connection, mint: PublicKey, buyerKps: Keypair[], lookupTableAddress: PublicKey) => {
  console.log("🚀 ~ makeBuyTx ~ buyerKps:", buyerKps)
  try {
    const mainAta = await makeCreateMainAta(connection, mint, buyerKps[0]);
    const buyersAta = await createBuyersAta(connection, mint, buyerKps[0].publicKey);
    const mainAta = await makeCreateMainAta(connection, mint, buyerKps[1]);
    const buyersAta = await createBuyersAta(connection, mint, buyerKps[1].publicKey);


  } catch (err) {
    console.error("makeBuyTx error", err);
    throw err;
  }
}
