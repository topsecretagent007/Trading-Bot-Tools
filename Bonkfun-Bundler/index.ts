import {
  Connection,
  Keypair,
  AddressLookupTableProgram,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";

import bs58 from "bs58";

import { PRIVATE_KEY, RPC_ENDPOINT } from "./constants";
import { createExtendLut, createLutInst } from "./src/LUT";
import { createTokenTx } from "./src/token";
import { makeBuyTx } from "./src/buy";
import { distributeSol } from "./src/distribute";
import { jitoWithAxios } from "./executor/jitoWithAxios";
import { saveLUTFile } from "./utils";

const main = async () => {
  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  const mainKp = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
  const solAmount = 1000000
  const buyerKps: Keypair[] = []
  
}

main()