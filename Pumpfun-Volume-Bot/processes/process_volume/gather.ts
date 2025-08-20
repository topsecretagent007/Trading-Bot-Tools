import { Keypair, SystemProgram, Transaction, Connection, ComputeBudgetProgram, PublicKey, Commitment, sendAndConfirmTransaction, TransactionInstruction } from "@solana/web3.js"
import base58 from "bs58"

import { COMMITMENT, DEBUG_MODE, Keys, MAIN_WALLET_PRIVATE_KEY, readJson, RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT, sleep } from "../../module"

const commitment: Commitment = COMMITMENT === "processed" ? "processed" : COMMITMENT === "confirmed" ? "confirmed" : "finalized"
const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT, commitment
})
const mainKp = Keypair.fromSecretKey(base58.decode(MAIN_WALLET_PRIVATE_KEY))



export const volumeGather = async (keysData: Keys) => {
  const { volumes: volumeKps, mint: mintKp, mainKp } = keysData
  const mint = mintKp.publicKey

  if (DEBUG_MODE)
    console.log("Mint address imported : ", mint.toBase58())

  const kpsWithSol: Keypair[] = []
  for (let i = 0; i < volumeKps.length; i++) {
    const balance = await connection.getBalance(volumeKps[i].publicKey, { commitment: "processed" })
    if (balance > 0)
      kpsWithSol.push(volumeKps[i])
  }
  console.log("Volume keypairs number with funds : ", kpsWithSol.length)

  const kpBundles: Keypair[][] = []
  let completed = 0
  const batchNum = 7
  const num = Math.ceil(kpsWithSol.length / batchNum)
  for (let i = 0; i < num; i++) {
    const bundle: Keypair[] = []
    for (let j = 0; j < batchNum; j++) {
      let index = i * batchNum + j
      if (kpsWithSol[index]) {
        bundle.push(kpsWithSol[index])
      }
    }
    kpBundles.push(bundle)
  }

  const processes = kpBundles.map(async (kps, index) => await volumeGatherProcess(kps, index, mainKp))
  await Promise.all(processes)
  console.log("All volume gathering completed")
}

const volumeGatherProcess = async (kps: Keypair[], index: number, mainKp: Keypair) => {
  const tx = new Transaction()
  for (let i = 0; i < kps.length; i++) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: mainKp.publicKey,
        toPubkey: kps[i].publicKey,
        lamports: 1000000000000000000
      })
    )
  }
  tx.feePayer = mainKp.publicKey
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  tx.sign(mainKp)
  const signature = await sendAndConfirmTransaction(connection, tx, [mainKp], { commitment })
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      blockhash: latestBlockhash.blockhash,
    }
  );
  console.log(`Volume ${index + 1} of ${kpBundles.length} completed : https://solscan.io/tx/${signature}`)
}


volumeGather()
