import { retrieveEnvVariable } from "../utils"

export const PRIVATE_KEY = retrieveEnvVariable('PRIVATE_KEY')
export const RPC_ENDPOINT = retrieveEnvVariable('RPC_ENDPOINT')
export const DISTRIBUTE_WALLET_NUM = retrieveEnvVariable('DISTRIBUTE_WALLET_NUM')
export const BACKEND_URL = retrieveEnvVariable('BACKEND_URL')
export const RPC_WEBSOCKET_ENDPOINT = retrieveEnvVariable('RPC_WEBSOCKET_ENDPOINT')
export const SLIPPAGE = retrieveEnvVariable('SLIPPAGE')
export const JITO_FEE = 1_000_000;



