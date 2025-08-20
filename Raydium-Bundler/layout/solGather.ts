import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { mainMenuWaiting, outputBalance, readBundlerWallets, readJson, saveBundlerWalletsToFile, sleep } from "../src/utils";
import { cluster, connection } from "../config";
import { bundlerWalletName, bundleWalletNum, needNewWallets } from "../settings"
import bs58 from 'bs58'
import { screen_clear } from "../menu/menu";
import { execute } from "../src/legacy";
import { createCloseAccountInstruction, getAssociatedTokenAddress, NATIVE_MINT } from "@solana/spl-token";
import { calcWalletSol } from "./walletCreate";

const walletNum = bundleWalletNum
let swapSolAmount = calcWalletSol();


export const sol_gather = async () => {
    screen_clear()
    console.log(`Gathering Sol from ${bundleWalletNum - 1} bundler wallets...`);

    const savedWallets = readBundlerWallets(bundlerWalletName)
    // console.log("🚀 ~ savedWallets: ", savedWallets)

    const walletKPs = savedWallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
    const data = readJson()
    const LP_wallet_keypair = Keypair.fromSecretKey(bs58.decode(data.mainKp!))
    const batchLength = 5
    const batchNum = Math.ceil((bundleWalletNum - 1) / batchLength)
    let successNum = 0

    console.log("walletKPs==========>", walletKPs);
    console.log("LP_wallet_keypair==========>", LP_wallet_keypair);
    console.log("batchLength==========>", batchLength);
    console.log("batchNum==========>", batchNum);


    try {
        
        if (successNum == batchNum) console.log("Successfully gathered sol from bundler wallets!")
    } catch (error) {
        console.log(`Failed to transfer SOL`)
    }
    await outputBalance(LP_wallet_keypair.publicKey)
    mainMenuWaiting()
}
