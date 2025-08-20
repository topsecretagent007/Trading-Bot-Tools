import { PublicKey, Keypair, AddressLookupTableProgram, ComputeBudgetProgram, Transaction, sendAndConfirmTransaction, Connection } from "@solana/web3.js"
import base58 from 'bs58'
import { readJson, readLUT, sleep } from "./utils"
import { PRIVATE_KEY, RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT } from "./constants"

const commitment = "confirmed"

const mainKp = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY))
const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT, commitment
})

const closeLut = async () => {
  try {
   
  } catch (error) {
    console.log("Unexpected error while closing the LUT")
  }
}


closeLut()
