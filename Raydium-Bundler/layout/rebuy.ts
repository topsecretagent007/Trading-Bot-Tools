import { connection } from "../config"
import base58 from "bs58"
import readline from "readline"
import {
    ComputeBudgetProgram,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction
} from "@solana/web3.js"
import {
    LiquidityPoolKeysV4,
    SPL_ACCOUNT_LAYOUT,
    TokenAccount
} from "@raydium-io/raydium-sdk";
import {
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountIdempotentInstruction,
    createCloseAccountInstruction,
    createTransferCheckedInstruction,
    getAssociatedTokenAddress,
    getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { LP_wallet_keypair } from "../settings";
import { getBuyTx, getSellTx } from "../src/swapOnlyAmm";
import { mainMenuWaiting, readHolderWalletDataJson, readJson, sleep } from "../src/utils";
import { execute } from "../src/legacy";
import { PoolKeys } from "../src/getPoolKeys";
import { rl } from "../menu/menu";
import { derivePoolKeys } from "../src/poolAll";

// let rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// })

const mainKp = LP_wallet_keypair
const mainPk = mainKp.publicKey
const data = readJson()

export const manualRebuy = async () => {
    try {
        
    }
    catch (error) {
        console.log(error);
    }
}