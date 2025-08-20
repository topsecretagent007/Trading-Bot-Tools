import { VersionedTransaction, Keypair, SystemProgram, Transaction, Connection, ComputeBudgetProgram, TransactionInstruction, TransactionMessage, AddressLookupTableProgram, PublicKey, SYSVAR_RENT_PUBKEY, Commitment, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import workerPool from 'workerpool'
import { AnchorProvider } from "@coral-xyz/anchor";
import { constants, openAsBlob } from "fs";
import base58 from "bs58"

import { PumpFunSDK } from "../../module/pumpfun_sdk/pumpfun";
import {
  // constants
  COMMITMENT,
  MAKER_RUN_DURATION,
  MAKER_WALLET_NUM,
  distributeSol,
  sleep,
  DEBUG_MODE,
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
  Keys,
  MAKER_TOKEN_BUY_MAX,
  MAKER_TOKEN_BUY_MIN,
} from "../../module"
import { BN } from "bn.js";

const commitment: Commitment = COMMITMENT === "processed" ? "processed" : COMMITMENT === "confirmed" ? "confirmed" : "finalized"
const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT, commitment
})
const sdk = new PumpFunSDK(new AnchorProvider(connection, new NodeWallet(new Keypair()), { commitment }));
let solBalEnough: boolean = true
let makerNum = 0


export const maker = async (keysData: Keys) => {

  const { makers, mainKp, mint: mintKp } = keysData

  const microLamports = 62_500
  const distributionNum = 20
  const units = 80_000
  const fee = Math.floor(microLamports * units / 10 ** 6)
  const distSolAmount = 0.003 * LAMPORTS_PER_SOL  // Fixed: Calculate proper distribution amount
  console.log("Distribution amount", distSolAmount)
  // fee is 0.0001SOL
  const round = Math.ceil(MAKER_WALLET_NUM / distributionNum)
  const makerQueue = new Array(round).fill(true)
  const distributionInterval = Math.floor(MAKER_RUN_DURATION / round * 1000)       // millisecond

  const mint = mintKp.publicKey

  let { feeRecipient } = await sdk.getGlobalAccount(commitment);
  const associatedBondingCurve = getAssociatedTokenAddressSync(
    mint,
    sdk.getBondingCurvePDA(mint),
    true
  );

  makerQueue.map(async (result, index) => {
    const keypairs = []
    for (let i = 0; i < distributionNum; i++) {
      if (makers[index * distributionNum + i])
        keypairs.push(makers[index * distributionNum + i])
    }

    if (!solBalEnough) return

    await sleep(distributionInterval * index)
    const mainBal = await connection.getBalance(mainKp.publicKey)
    if (mainBal < 0.003 * distributionNum) {
      console.log("Insufficient SOL balance in main wallet ", (mainBal / 10 ** 9).toFixed(3), "SOL")
      console.log("Exiting...")
      solBalEnough = false
      return
    }

    const kps = await distributeSol(connection, mainKp, distSolAmount, keypairs, "maker")
    if (!kps) {
      console.log("Distribution failed")
      return
    }

    kps.map(async (kp, kpIndex) => {
      try {
        
      } catch (error) {
        console.log("Error in maker transaction")
        if (DEBUG_MODE)
          console.log(error)
      }
    })
  })
}
