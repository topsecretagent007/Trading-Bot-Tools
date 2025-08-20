
import {
  Connection, PublicKey,
  GetProgramAccountsFilter
} from "@solana/web3.js";

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {

  SPL_ACCOUNT_LAYOUT,
  TokenAccount,
  findProgramAddress,
} from '@raydium-io/raydium-sdk';


export async function getTokenAccountBalance(connection: Connection, wallet: string, mint_token: string) {
 
}

export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg)
  }
}


export async function getWalletTokenAccount(connection: Connection, wallet: PublicKey): Promise<TokenAccount[]> {
  
}


export async function getWalletTokenAccountMint(connection: Connection, wallet: PublicKey, mint: PublicKey): Promise<TokenAccount[]> {
  
}


export function getATAAddress(programId: PublicKey, owner: PublicKey, mint: PublicKey) {
  const { publicKey, nonce } = findProgramAddress(
    [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
  );
  return { publicKey, nonce };
}