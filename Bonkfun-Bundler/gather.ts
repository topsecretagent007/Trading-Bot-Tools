import { ComputeBudgetProgram, Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, createCloseAccountInstruction, createTransferCheckedInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { SPL_ACCOUNT_LAYOUT, TokenAccount } from "@raydium-io/raydium-sdk";
import base58 from "bs58"

import { readJson, saveNewFile, sleep } from "./utils"
import { getSellTxWithJupiter } from "./utils/swapOnlyAmm";
import { execute } from "./executor/legacy";
import { PRIVATE_KEY, RPC_ENDPOINT } from "./constants";


const connection = new Connection(RPC_ENDPOINT, { commitment: "confirmed" });
const mainKp = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY))

const main = async () => {
  const walletsData = readJson()

  const wallets = walletsData.map(({ privateKey }) => Keypair.fromSecretKey(base58.decode(privateKey)))
  wallets.map(async (kp, i) => {
    try {

    } catch (error) {
      console.log("transaction error while gathering")
      return
    }
  })
}

main()