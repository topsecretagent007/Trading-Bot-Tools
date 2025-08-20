import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { Logger } from 'pino';
import dotenv from 'dotenv';



// import {
//     COMMITMENT_LEVEL,
//     PRIVATE_KEY,
//     QUOTE_MINT,
//     RPC_ENDPOINT,
//     RPC_WEBSOCKET_ENDPOINT,

// } from "../contants";
import base58 from "bs58";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import axios from "axios";

dotenv.config();


const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const QUOTE_MINT = process.env.QUOTE_MINT!;
const RPC_ENDPOINT = process.env.RPC_ENDPOINT!;


export const retrieveEnvVariable = (variableName: string, logger: Logger) => {

};

export async function getTokenBalance() {

}

export async function getSolBalance() {

}

export async function getSOLPrice() {

}

export const getBuyTxWithJupiter = async (wallet: Keypair, quoteMint: PublicKey, amount: number) => {

};


export const getSellTxWithJupiter = async (wallet: Keypair, baseMint: PublicKey, amount: number) => {

};