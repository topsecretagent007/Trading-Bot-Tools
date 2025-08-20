import { AddressLookupTableProgram, ComputeBudgetProgram, Keypair, PublicKey, sendAndConfirmRawTransaction, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js"
import {
    DEVNET_PROGRAM_ID,
    jsonInfo2PoolKeys,
    Liquidity,
    MAINNET_PROGRAM_ID,
    MARKET_STATE_LAYOUT_V3, LiquidityPoolKeys,
} from "@raydium-io/raydium-sdk"
import { getAssociatedTokenAddress, getAssociatedTokenAddressSync, getMint, NATIVE_MINT, unpackMint } from "@solana/spl-token";
import bs58 from "bs58"
import BN from "bn.js"

import { mainMenuWaiting, outputBalance, readBundlerWallets, readJson, readLUTAddressFromFile, readWallets, retrieveEnvVariable, saveDataToFile, sleep } from "../src/utils"
import {
    getTokenAccountBalance,
    assert,
    getWalletTokenAccount,
} from "../src/get_balance";
import {
    connection,
    cluster,
} from "../config";
import {
    quote_Mint_amount,
    input_baseMint_tokens_percentage,
    bundlerWalletName,
    batchSize
} from "../settings"

import { executeVersionedTx } from "../src/execute";
import { jitoWithAxios } from "../src/jitoWithAxios";
// import { createLookupTable } from "../layout/createLUT";

const programId = cluster == "devnet" ? DEVNET_PROGRAM_ID : MAINNET_PROGRAM_ID

export async function manual_all_sell() {
    const wallets = readBundlerWallets(bundlerWalletName)
    const data = readJson()
    const lutAddress = readLUTAddressFromFile()

    const walletKPs = wallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
    const lookupTableAddress = new PublicKey(lutAddress!);
    const LP_wallet_keypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(data.mainKp!)));

    console.log("LP Wallet Address: ", LP_wallet_keypair.publicKey.toString());

    let params: any = {
        mint: data.mint ? new PublicKey(data.mint) : null,
        marketId: data.marketId ? new PublicKey(data.marketId) : null,
        poolId: data.poolId ? new PublicKey(data.poolId) : null,
        mainKp: data.mainKp,
        poolKeys: data.poolKeys,
        removed: data.removed
    }

   
        console.log("------------- Bundle Successfully done ----------");
    }
}