import { MAINNET_PROGRAM_ID, DEVNET_PROGRAM_ID } from "@raydium-io/raydium-sdk"
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js"
import {
  getMint,
  TOKEN_PROGRAM_ID,
  ACCOUNT_SIZE,
  createInitializeAccountInstruction,
  NATIVE_MINT,
} from "@solana/spl-token"
import BN from "bn.js"
import { DexInstructions, Market } from "@project-serum/serum"
import {
  calculateTotalAccountSize,
  EVENT_QUEUE_HEADER_SIZE,
  EVENT_SIZE,
  REQUEST_QUEUE_HEADER_SIZE,
  REQUEST_SIZE,
  ORDERBOOK_HEADER_SIZE,
  ORDERBOOK_NODE_SIZE,
  sleep,
} from "../src/utils"
import { cluster, connection } from "../config"
import { executeLegacyTx } from "./execute"

const raydiumProgramId = cluster == "mainnet" ?
  MAINNET_PROGRAM_ID : DEVNET_PROGRAM_ID

const LOT_SIZE = -3
const TICK_SIZE = 8
const TOTAL_EVENT_QUEUE_SIZE = calculateTotalAccountSize(
  128,
  EVENT_QUEUE_HEADER_SIZE,
  EVENT_SIZE
)

const TOTAL_REQUEST_QUEUE_SIZE = calculateTotalAccountSize(
  10,
  REQUEST_QUEUE_HEADER_SIZE,
  REQUEST_SIZE
)

const TOTAL_ORDER_BOOK_SIZE = calculateTotalAccountSize(
  201,
  ORDERBOOK_HEADER_SIZE,
  ORDERBOOK_NODE_SIZE
)

const getVaultNonce = async (market: PublicKey, programId: PublicKey) => {
  let i = 0
  let result = null
  while (true) {
    result =
      await getVaultOwnerAndNonce(
        market,
        programId,
        i
      )
    if (result)
      return result
    else
      i++
  }
}


export async function getVaultOwnerAndNonce(
  marketAddress: PublicKey,
  dexAddress: PublicKey,
  seedNum: number
): Promise<[vaultOwner: PublicKey, nonce: BN] | undefined> {
  let nonce = new BN(seedNum)
  // console.log("nonce:", nonce)
  try {
  
  } catch (e) {
    console.log('found incompatible bump here, trying again')
  }
}


export const createMarket = async (
  wallet: Keypair,
  baseMintAddress: PublicKey
) => {
  try {
    
  } catch (error) {
    console.error("Error creating market: ", error);
    return
  }
}
