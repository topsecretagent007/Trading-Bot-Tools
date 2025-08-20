import {
  Commitment,
  Connection,
  Finality,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { Program, Provider } from "@coral-xyz/anchor";
import { setGlobalDispatcher, Agent } from 'undici'
import { GlobalAccount } from "./globalAccount";
import {
  CompleteEvent,
  CreateEvent,
  CreateTokenMetadata,
  PriorityFee,
  PumpFunEventHandlers,
  PumpFunEventType,
  SetParamsEvent,
  TradeEvent,
  TransactionResult,
} from "./types";
import {
  toCompleteEvent,
  toCreateEvent,
  toSetParamsEvent,
  toTradeEvent,
} from "./events";
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { BondingCurveAccount } from "./bondingCurveAccount";
import { BN } from "bn.js";
import {
  DEFAULT_COMMITMENT,
  DEFAULT_FINALITY,
  buildTx,
  calculateWithSlippageBuy,
  calculateWithSlippageSell,
  getRandomInt,
  sendTx,
} from "./util";
import { PumpFun, IDL } from "./IDL";
import { getUploadedMetadataURI } from "./uploadToIpfs";
import { jitoWithAxios } from "./jitoWithAxios";
import { RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT } from "./constants";
import { global_mint } from "./config";

const PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const MPL_TOKEN_METADATA_PROGRAM_ID =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

export const GLOBAL_ACCOUNT_SEED = "global";
export const MINT_AUTHORITY_SEED = "mint-authority";
export const BONDING_CURVE_SEED = "bonding-curve";
export const METADATA_SEED = "metadata";

export const DEFAULT_DECIMALS = 6;

export class PumpFunSDK {
  public program: Program<PumpFun>;
  public connection: Connection;
  constructor(provider?: Provider) {
    this.program = new Program<PumpFun>(IDL as PumpFun, provider);
    this.connection = this.program.provider.connection;
  }
}
