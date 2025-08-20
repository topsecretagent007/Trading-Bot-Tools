import { Keypair, SystemProgram, Transaction, Connection, ComputeBudgetProgram, Commitment, sendAndConfirmTransaction, TransactionInstruction } from "@solana/web3.js"
import { createAssociatedTokenAccountIdempotentInstruction, createCloseAccountInstruction, createTransferCheckedInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { COMMITMENT, DEBUG_MODE, Keys, RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT, sleep } from "../../module"

const commitment: Commitment = COMMITMENT === "processed" ? "processed" : COMMITMENT === "confirmed" ? "confirmed" : "finalized"
const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT, commitment
})

export const makerGather = async (keysData: Keys) => {
  const { mint: mintKp, makers: makerKps, mainKp } = keysData
  const mint = mintKp.publicKey

  if (DEBUG_MODE)
    console.log("Mint address imported : ", mint.toBase58())

  const totalNumber = makerKps.length
  console.log("Total maker number", totalNumber)

  const kpBundles: Keypair[][] = []
  let completed = 0
  const batchNum = 4
  const num = Math.ceil(makerKps.length / batchNum)
  for (let i = 0; i < num; i++) {
    const bundle: Keypair[] = []
    for (let j = 0; j < batchNum; j++) {
      let index = i * batchNum + j
      if (makerKps[index]) {
        bundle.push(makerKps[index])
      }
    }
    kpBundles.push(bundle)
  }

  const mainKpAta = getAssociatedTokenAddressSync(mint, mainKp.publicKey)

  async function makerGatherProcess(kps: Keypair[], index: number) {
    let isEmptyTx = true
    try {
      
    } catch (error) {
      console.log("Error happened while gathering in one of the bundles")
      if (DEBUG_MODE)
        console.log(error)
      return
    }
  }

  const processes = kpBundles.map(async (kps, index) => await makerGatherProcess(kps, index))
  await Promise.all(processes)
}
