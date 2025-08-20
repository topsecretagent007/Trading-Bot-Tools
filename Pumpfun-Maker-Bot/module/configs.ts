import dotenv from "dotenv";
import { retrieveEnvVariable } from "./utils/utils";

dotenv.config();

// Environment Variables
export const MAIN_WALLET_PRIVATE_KEY = retrieveEnvVariable("MAIN_WALLET_PRIVATE_KEY");
export const RPC_ENDPOINT = retrieveEnvVariable("RPC_ENDPOINT");
export const RPC_WEBSOCKET_ENDPOINT = retrieveEnvVariable("RPC_WEBSOCKET_ENDPOINT");
export const JITO_KEY = retrieveEnvVariable("JITO_KEY");
export const BLOCK_ENGINE_URL = retrieveEnvVariable("BLOCK_ENGINE_URL");

// Configuration Constants
export const DEBUG_MODE = process.env.DEBUG_MODE === "true";
export const RETRY_MODE = process.env.RETRY_MODE === "true";
export const COMMITMENT: "processed" | "confirmed" | "finalized" = "confirmed";

// Wallet Configuration
export const MAKER_WALLET_NUM = parseInt(process.env.MAKER_WALLET_NUM || "5");
export const VOLUME_WALLET_NUM = parseInt(process.env.VOLUME_WALLET_NUM || "10");
export const TOKEN_DISTRIBUTION_WALLET_NUM = parseInt(process.env.TOKEN_DISTRIBUTION_WALLET_NUM || "5");

// SOL Amounts
export const BUYER_SOL_AMOUNT = parseFloat(process.env.BUYER_SOL_AMOUNT || "0.1");
export const MINT_TO_MANUAL_GATHER = process.env.MINT_TO_MANUAL_GATHER || "";

// Swap Configuration
export const SWAP_AMOUNT_MIN = parseFloat(process.env.SWAP_AMOUNT_MIN || "0.001");
export const SWAP_AMOUNT_MAX = parseFloat(process.env.SWAP_AMOUNT_MAX || "0.005");
export const SWAP_AMOUNT_TOTAL = parseFloat(process.env.SWAP_AMOUNT_TOTAL || "0.05");
export const BUNDLE_SLIPPAGE = parseFloat(process.env.BUNDLE_SLIPPAGE || "0.1");

// Additional Configuration Constants
export const MAKER_RUN_DURATION = parseInt(process.env.MAKER_RUN_DURATION || "300"); // 5 minutes in seconds
export const MAKER_TOKEN_BUY_MIN = parseFloat(process.env.MAKER_TOKEN_BUY_MIN || "0.001");
export const MAKER_TOKEN_BUY_MAX = parseFloat(process.env.MAKER_TOKEN_BUY_MAX || "0.005");

// Volume Configuration Constants
export const VOLUME_RUN_DURATION = parseInt(process.env.VOLUME_RUN_DURATION || "300"); // 5 minutes in seconds
export const VOLUME_TOKEN_BUY_MIN = parseFloat(process.env.VOLUME_TOKEN_BUY_MIN || "0.001");
export const VOLUME_TOKEN_BUY_MAX = parseFloat(process.env.VOLUME_TOKEN_BUY_MAX || "0.005");

// Default Token Info
export const TOKNE_INFO = {
  name: "Pumpfun Volume Bot Token",
  symbol: "PVBT",
  description: "A token created by the Pumpfun Volume Bot for testing and demonstration purposes",
  showName: "Pumpfun Volume Bot Token",
  createOn: Date.now(),
  twitter: "https://twitter.com/greenfox",
  telegram: "https://t.me/greenfox",
  website: "https://github.com/moonbot777/Pumpfun-Volume-Bot",
  file: "https://raw.githubusercontent.com/moonbot777/Pumpfun-Volume-Bot/main/logo.png"
}; 