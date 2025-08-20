import { Raydium, TxVersion, parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2'
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { RPC_ENDPOINT } from '../constants'

export const connection = new Connection(RPC_ENDPOINT) // Replace with actual RPC URL
export const txVersion = TxVersion.LEGACY
const cluster = 'mainnet' // 'mainnet' | 'devnet'

let raydium: Raydium | undefined

// Initialize the Raydium SDK and return it
export const initSdk = async (wallet: PublicKey, params?: { loadToken?: boolean }) => {
    if (raydium) return raydium

    // Print a warning if using a free RPC node
    if (connection.rpcEndpoint === clusterApiUrl('mainnet-beta')) {// mainnet-beta
        console.warn('Using free RPC node might cause unexpected errors. Consider using a paid RPC node.')
    }


    // Load the Raydium SDK
    raydium = await Raydium.load({
        owner: wallet,
        connection,
        cluster,
        disableFeatureCheck: true,
        disableLoadToken: !params?.loadToken,
        blockhashCommitment: 'confirmed',
    })

    return raydium
}



