import { Keypair, PublicKey } from "@solana/web3.js"
import {
    NATIVE_MINT,
    getAssociatedTokenAddress,
} from '@solana/spl-token'
import { getSellTx } from "./swapOnlyAmm"
import { execute } from "./legacy"
import { connection, SWAP } from "../config"
import { sellInJupito } from "./jupitoBuy"


/**
 * @func sell
 * @description 'sell token'
 * @param poolId: PublicKey 'pool addr'
 * @param baseMint: PublicKey 'token addr'
 * @param wallet: Keypair 'subwallet keypair'
 */
export const sell = async (poolId: PublicKey, baseMint: PublicKey, wallet: Keypair) => {

   

}
