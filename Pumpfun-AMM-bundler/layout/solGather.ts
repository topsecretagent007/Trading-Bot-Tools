import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { mainMenuWaiting, outputBalance, readBundlerWallets, readJson, saveBundlerWalletsToFile, sleep } from "../src/utils";
import { cluster, connection } from "../config";
import { bundlerWalletName, bundleWalletNum } from "../settings"
import bs58 from 'bs58'
import { screen_clear } from "../menu/menu";
import { execute } from "../src/legacy";
import { createCloseAccountInstruction, getAssociatedTokenAddress, NATIVE_MINT } from "@solana/spl-token";

const walletNum = bundleWalletNum

export const sol_gather = async () => {
    screen_clear()
    console.log(`Gathering Sol from ${bundleWalletNum} bundler wallets...`);

    const savedWallets = readBundlerWallets(bundlerWalletName)
    // console.log("🚀 ~ savedWallets: ", savedWallets)

    const walletKPs = savedWallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
    const data = readJson()
    const mint = new PublicKey(data.mint!)
    const LP_wallet_keypair = Keypair.fromSecretKey(bs58.decode(data.mainKp!))
    const batchLength = 5
    const batchNum = Math.ceil(bundleWalletNum / batchLength)
    let successNum = 0

    await outputBalance(LP_wallet_keypair.publicKey)
    mainMenuWaiting()
}
