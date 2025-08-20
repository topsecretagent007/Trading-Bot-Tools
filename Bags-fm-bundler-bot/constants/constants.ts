import { retrieveEnvVariable } from "../utils"

export const PRIVATE_KEY = retrieveEnvVariable('PRIVATE_KEY')
export const RPC_ENDPOINT = retrieveEnvVariable('RPC_ENDPOINT')
export const DISTRIBUTE_WALLET_NUM = retrieveEnvVariable('DISTRIBUTE_WALLET_NUM')
export const BACKEND_URL = retrieveEnvVariable('BACKEND_URL')
export const RPC_WEBSOCKET_ENDPOINT = retrieveEnvVariable('RPC_WEBSOCKET_ENDPOINT')
export const SLIPPAGE = retrieveEnvVariable('SLIPPAGE')
export const JITO_FEE = 1_000_000;

// Bags.fm specific constants
export const BAGS_FM_PROGRAM_ID = "BAGSRzq3QTeQ1f7BsAkf6e5Qw49HkQLbz2Xbfz7eQLVV";
export const BAGS_FM_AUTHORITY = "4Bu96XjU84XjPDSpveTVf6LYGCkfW5FK7SNkREWcEfV4";
export const DEFAULT_TRADE_AMOUNT = 500000; // 0.0005 SOL in lamports
export const MAX_TRANSACTION_SIZE = 1232; // Maximum transaction size in bytes
export const COMPUTE_UNIT_PRICE = 100_000; // Micro-lamports per compute unit
export const COMPUTE_UNIT_LIMIT = 1_000_000; // Maximum compute units per transaction



