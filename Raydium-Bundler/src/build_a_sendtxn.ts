import {
  buildSimpleTransaction,
  InnerSimpleV0Transaction,

} from '@raydium-io/raydium-sdk';
import {
  Connection,
  Keypair,
  SendOptions,
  Signer,
  Transaction,
  VersionedTransaction,
  PublicKey
} from '@solana/web3.js';

import {
  addLookupTableInfo,
  cluster,
  connection,
  makeTxVersion,
} from '../config';

import { Liquidity } from '@raydium-io/raydium-sdk';

import { getComputeBudgetConfig, getComputeBudgetConfigHigh } from "./budget";
import { BN } from "bn.js";

export async function sendTx(
  connection: Connection,
  payer: Keypair | Signer,
  txs: (VersionedTransaction | Transaction)[],
  options?: SendOptions
): Promise<string[]> {
 
  return txids;
}



export async function buildAndSendTx(keypair: Keypair, innerSimpleV0Transaction: InnerSimpleV0Transaction[], options?: SendOptions) {
  
  return await sendTx(connection, keypair, willSendTx, options)
}



export async function build_swap_instructions(
  connection: any, 
  poolKeys: any, 
  tokenAccountRawInfos_Swap: any, 
  keypair: any, 
  inputTokenAmount: any, 
  minAmountOut: any,
  lookupTableCache: any
) {

  
  return innerTransactions;

}



export async function build_swap_sell_instructions(
  Liquidity1: any, 
  connection: any, 
  poolKeys: any, 
  tokenAccountRawInfos_Swap: any, 
  keypair: any, 
  inputTokenAmount: any, 
  minAmountOut: any
) {

  

  return innerTransactions;

}


export async function build_create_pool_instructions(
  programId: any,
  market_id: any,
  keypair: any,
  tokenAccountRawInfos: any,
  baseMint: any,
  baseDecimals: any,
  quoteMint: any,
  quoteDecimals: any,
  delay_pool_open_time: any,
  base_amount_input: any,
  quote_amount: any,
  lookupTableCache: any
) {

  return innerTransactions;

}