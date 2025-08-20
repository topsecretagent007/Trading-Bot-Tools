import { Keypair, PublicKey } from "@solana/web3.js";
import { getTokenBalance, getSOLPrice, getBuyTxWithJupiter, getSellTxWithJupiter, getSolBalance } from "./src/utils";
import { executeJitoTx } from "./src/utils/jito"
import base58 from "bs58";
import dotenv from 'dotenv';
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const QUOTE_MINT = process.env.QUOTE_MINT!;
const MAIN_MINT = process.env.MAIN_MINT!;
const IS_JITO = process.env.IS_JITO!;
const LIMIT_SOL_PRICE = Number(process.env.LIMIT_SOL_PRICE!);
const MIN_SOL_BALANCE = Number(process.env.MIN_SOL_BALANCE!);
const tokenLamport = 10 ** 6;



const wallet = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY));

async function main() {
    while (true) {

    }
}


main();