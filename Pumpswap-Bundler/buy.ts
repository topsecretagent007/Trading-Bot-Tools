import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { PUMPFUN_POOL_AUTH } from "./constants/pumpfun";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createSyncNativeInstruction, createAssociatedTokenAccountInstruction, createCloseAccountInstruction } from "@solana/spl-token";
import { NATIVE_MINT } from "@solana/spl-token";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { connection as solanaConnection, PUMPFUN_PROGRAM_ID, PUMPSWAP_PROGRAM_ADDR } from "./constants/constants";
import { PoolReserves } from "./src/pumpswap/types";
import { PUMPSWAP_EVENT_AUTH, PUMPSWAP_GLOBAL_CONFIG, PUMPSWAP_MAINNET_FEE_ADDR, PUMPSWAP_POOL } from "./constants/pumpswap";
import { createPumpswapBuyIx } from "./src/pumpswap/instructions";

export const getBuyTx = async (mintAddress: PublicKey, coinCreator: PublicKey, wallets: Keypair[], buyAmounts: number[], slippage: number) => {
   
}

function getBuySwapBase(
    quoteAmountOut: number,
    reserve: PoolReserves,
    slippage: number = 0
): { maxQuote: number } {
   
}
