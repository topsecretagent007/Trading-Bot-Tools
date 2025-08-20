import { retrieveEnvVariable } from "../utils"

// export const PRIVATE_KEY = retrieveEnvVariable('PRIVATE_KEY')
export const RPC_ENDPOINT = retrieveEnvVariable('RPC_ENDPOINT')
export const RPC_WEBSOCKET_ENDPOINT = retrieveEnvVariable('RPC_WEBSOCKET_ENDPOINT')

export const MONGO_URL = retrieveEnvVariable('MONGO_URL')
export const BOT_TOKEN = retrieveEnvVariable('BOT_TOKEN')

export const IS_RANDOM = retrieveEnvVariable('IS_RANDOM') === 'true'
export const SWAP_ROUTING = retrieveEnvVariable('SWAP_ROUTING') === 'true'

export const SELL_PERCENT = Number(retrieveEnvVariable('SELL_PERCENT'))

export const WALLET_NUM = Number(retrieveEnvVariable('WALLET_NUM'))

export const TX_FEE = Number(retrieveEnvVariable('TX_FEE'))

export const TOKEN_MINT = retrieveEnvVariable('TOKEN_MINT')
export const POOL_ID = retrieveEnvVariable('POOL_ID')

export const SNIPING_COMMITMENT = retrieveEnvVariable('SNIPING_COMMITMENT')
export const COMMITMENT = retrieveEnvVariable('COMMITMENT')

export const ADDITIONAL_FEE = Number(retrieveEnvVariable('ADDITIONAL_FEE'))
// export const JITO_KEY = retrieveEnvVariable('JITO_KEY')
// export const BLOCKENGINE_URL = retrieveEnvVariable('BLOCKENGINE_URL')
// export const JITO_FEE = Number(retrieveEnvVariable('JITO_FEE'))
