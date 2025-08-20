import dotenv from 'dotenv'
import fs from 'fs'
import readline from 'readline'
import { Connection, GetProgramAccountsFilter, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { connection } from "../config";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SPL_ACCOUNT_LAYOUT, TokenAccount } from "@raydium-io/raydium-sdk";
import base58 from "bs58";
import { PoolInfo, PoolInfoStr } from "./types";
import { init, security_checks } from '..'
import { rl } from '../menu/menu';

// dotenv.config()

export const retrieveEnvVariable = (variableName: string) => {
  const variable = process.env[variableName] || ''
  if (!variable) {
    console.log(`${variableName} is not set`)
    process.exit(1)
  }
  return variable
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function calcNonDecimalValue(value: number, decimals: number): number {
  return Math.trunc(value * (Math.pow(10, decimals)))
}

export function calcDecimalValue(value: number, decimals: number): number {
  return value / (Math.pow(10, decimals))
}

export async function getNullableResultFromPromise<T>(value: Promise<T>, opt?: { or?: T, logError?: boolean }): Promise<T | null> {
  return value.catch((error) => {
    if (opt) console.log({ error })
    return opt?.or != undefined ? opt.or : null
  })
}

// Define the type for the JSON file content
export interface Data {
  privateKey: string;
  pubkey: string;
}

export const EVENT_QUEUE_LENGTH = 2978;
export const EVENT_SIZE = 88;
export const EVENT_QUEUE_HEADER_SIZE = 32;

export const REQUEST_QUEUE_LENGTH = 63;
export const REQUEST_SIZE = 80;
export const REQUEST_QUEUE_HEADER_SIZE = 32;

export const ORDERBOOK_LENGTH = 909;
export const ORDERBOOK_NODE_SIZE = 72;
export const ORDERBOOK_HEADER_SIZE = 40;

export function calculateTotalAccountSize(
  individualAccountSize: number,
  accountHeaderSize: number,
  length: number
) {
  
}

export function calculateAccountLength(
  totalAccountSize: number,
  accountHeaderSize: number,
  individualAccountSize: number
) {
  const accountPadding = 12;
  return Math.floor(
    (totalAccountSize - accountPadding - accountHeaderSize) /
    individualAccountSize
  );
}

export const outputBalance = async (solAddress: PublicKey) => {
  const bal = await connection.getBalance(solAddress, "processed") / LAMPORTS_PER_SOL
  console.log("Balance in ", solAddress.toBase58(), " is ", bal, "SOL")
  return bal
}

/**
 * 
 *  For pool creation
 * 
 */

export async function getTokenAccountBalance(
  connection: Connection,
  wallet: string,
  mint_token: string
) {
  
}

export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg);
  }
}

export async function getWalletTokenAccount(
  connection: Connection,
  wallet: PublicKey
): Promise<TokenAccount[]> {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  });
  return walletTokenAccount.value.map((i) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
  }));
}

export async function getATAAddress(
  programId: PublicKey,
  owner: PublicKey,
  mint: PublicKey
) {
  const [publicKey, nonce] = await PublicKey.findProgramAddress(
    [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
  );
  return { publicKey, nonce };
}

export function readJson(filename: string = "data.json"): PoolInfoStr {
  
}

export function readWallets(filename: string = "wallets.json"): string[] {
  
}

export const readBundlerWallets = (filename: string) => {
  const filePath: string = `wallets/${filename}.json`

};

export const saveLUTAddressToFile = (publicKey: string, filePath: string = "wallets/lutAddress.txt") => {
  try {
    // Write the public key to the specified file
    fs.writeFileSync(filePath, publicKey);
    console.log("Public key saved successfully to", filePath);
  } catch (error) {
    console.log('Error saving public key to file:', error);
  }
};

export const readLUTAddressFromFile = (filePath: string = "wallets/lutAddress.txt") => {
  
};

export const saveDataToFile = (newData: PoolInfo, filePath: string = "data.json") => {
  
};

export const saveVolumeWalletToFile = (newData: Data[], filePath: string = "wallets/volumeWallets.json") => {
 
};

export const saveHolderWalletsToFile = (newData: Data[], filePath: string = "wallets/holderWallets.json") => {
  
};

export const saveBundlerWalletsToFile = (newData: string[], filename: string) => {
  const filePath: string = `wallets/${filename}.json`
  try {
    // Remove the existing file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File ${filePath} deleted.`);
    }

    // Write the new data to the file
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
    console.log("File is saved successfully.");

  } catch (error) {
    console.log('Error saving data to JSON file:', error);
  }
};

// Function to read JSON file
export function readVolumeWalletDataJson(filename: string = "wallets/volumeWallets.json"): Data[] {
  if (!fs.existsSync(filename)) {
    // If the file does not exist, create an empty array
    fs.writeFileSync(filename, '[]', 'utf-8');
  }
  const data = fs.readFileSync(filename, 'utf-8');
  return JSON.parse(data) as Data[];
}

// Function to read JSON file
export function readHolderWalletDataJson(filename: string = "wallets/holderWallets.json"): Data[] {
  if (!fs.existsSync(filename)) {
    // If the file does not exist, create an empty array
    fs.writeFileSync(filename, '[]', 'utf-8');
  }
  const data = fs.readFileSync(filename, 'utf-8');
  return JSON.parse(data) as Data[];
}

export const securityCheckWaiting = () => {
  rl.question('press Enter key to continue', (answer: string) => {
    security_checks()
  })
}

export const mainMenuWaiting = () => {
  rl.question('press Enter key to continue', (answer: string) => {
    init()
  })
  // rl.close()
}