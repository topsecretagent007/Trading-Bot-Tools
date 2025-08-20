import { Liquidity, LiquidityPoolKeysV4, MARKET_STATE_LAYOUT_V3, Market } from "@raydium-io/raydium-sdk";
import { Commitment, Connection, PublicKey } from "@solana/web3.js";

import dotenv from 'dotenv'
import { sleep } from "./utils";
dotenv.config();

export class PoolKeys {
    static SOLANA_ADDRESS = 'So11111111111111111111111111111111111111112'
    static RAYDIUM_POOL_V4_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
    static OPENBOOK_ADDRESS = 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX';
    static SOL_DECIMALS = 9

}

interface MintInfo {
    value: {
        data: {
            parsed: {
                info: {
                    decimals: number
                }
            }
        }
    }
}