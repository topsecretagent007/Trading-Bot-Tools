import { retrieveEnvVariable } from "../utils";
import { parseTaskCSV } from "../utils/csvParser";
import { Connection, PublicKey } from "@solana/web3.js";

// Read mint wallet private key from unified task.csv file
const taskData = parseTaskCSV("task.csv");
export const MINT_WALLET_PRIVATE = taskData.mintWallet || retrieveEnvVariable("MINT_WALLET_PRIVATE");

export const RPC_ENDPOINT = retrieveEnvVariable("RPC_ENDPOINT");
export const RPC_WEBSOCKET_ENDPOINT = retrieveEnvVariable(
  "RPC_WEBSOCKET_ENDPOINT"
);
export const RPC_LIL_JITO_ENDPOINT = retrieveEnvVariable("RPC_LIL_JITO_ENDPOINT");

export const TOKEN_NAME = retrieveEnvVariable("TOKEN_NAME");
export const TOKEN_SYMBOL = retrieveEnvVariable("TOKEN_SYMBOL");
export const DESCRIPTION = retrieveEnvVariable("DESCRIPTION");
export const TOKEN_SHOW_NAME = retrieveEnvVariable("TOKEN_SHOW_NAME");
export const TOKEN_CREATE_ON = retrieveEnvVariable("TOKEN_CREATE_ON");
export const TWITTER = retrieveEnvVariable("TWITTER");
export const TELEGRAM = retrieveEnvVariable("TELEGRAM");
export const WEBSITE = retrieveEnvVariable("WEBSITE");
export const FILE = retrieveEnvVariable("FILE");

export const DEV_BUY_AMOUNT = Number(retrieveEnvVariable("DEV_BUY_AMOUNT"));
export const MIGRATION_BUY_AMOUNT = Number(retrieveEnvVariable("MIGRATION_BUY_AMOUNT"));

export const JITO_FEE = Number(retrieveEnvVariable("JITO_FEE"));
export const SLIPPAGE = Number(retrieveEnvVariable("SLIPPAGE"));

export const global_mint = new PublicKey(
  "p89evAyzjd9fphjJx7G3RFA48sbZdpGEppRcfRNpump"
);

export const PUMPFUN_PROGRAM_ID = new PublicKey(
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
);
export const PUMPSWAP_PROGRAM_ADDR = new PublicKey(
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
);

export const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
  commitment: "confirmed",
});
