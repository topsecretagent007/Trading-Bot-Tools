import bs58 from "bs58"
import { AddressLookupTableProgram, ComputeBudgetProgram, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SignatureStatus, SystemProgram, Transaction, TransactionConfirmationStatus, TransactionInstruction, TransactionMessage, TransactionSignature, VersionedTransaction } from "@solana/web3.js"
import { cluster, connection } from "../config";
import { mainMenuWaiting, outputBalance, readBundlerWallets, readJson, saveLUTAddressToFile, sleep } from "../src/utils";
import { bundlerWalletName } from "../settings";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID, unpackMint } from "@solana/spl-token";
import { DEVNET_PROGRAM_ID, Liquidity, MAINNET_PROGRAM_ID, MARKET_STATE_LAYOUT_V3 } from "@raydium-io/raydium-sdk";
import { derivePoolKeys } from "../src/poolAll";

import { calcWalletSol } from "./walletCreate";

const data = readJson()
const SIGNER_WALLET = Keypair.fromSecretKey(bs58.decode(data.mainKp!))
let swapSolAmount = calcWalletSol();

export const createAndSendV0Tx = async (txInstructions: TransactionInstruction[]) => {
    // Step 1 - Fetch Latest Blockhash

    // Step 2 - Generate Transaction Message

    // Step 3 - Sign your transaction with the required `Signers`

    // Step 4 - Send our v0 transaction to the cluster

    // Step 5 - Confirm Transaction 
    // if (confirmation.value.err) { throw new Error("   ❌ - Transaction not confirmed.") }
}

async function confirmTransaction(
    connection: Connection,
    signature: TransactionSignature,
    desiredConfirmationStatus: TransactionConfirmationStatus = 'confirmed',
    timeout: number = 30000,
    pollInterval: number = 1000,
    searchTransactionHistory: boolean = false
): Promise<SignatureStatus> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const { value: statuses } = await connection.getSignatureStatuses([signature], { searchTransactionHistory });

        if (!statuses || statuses.length === 0) {
            throw new Error('Failed to get signature status');
        }

        const status = statuses[0];

        if (status === null) {
            // If status is null, the transaction is not yet known
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            continue;
        }

        if (status.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
        }

        if (status.confirmationStatus && status.confirmationStatus === desiredConfirmationStatus) {
            return status;
        }

        if (status.confirmationStatus === 'finalized') {
            return status;
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Transaction confirmation timeout after ${timeout}ms`);
}

async function createLUT() {
    try {
        
    } catch (err) {
        console.log("Error in creating Lookuptable. Please retry this.")
        return
    }

}

async function addAddressesToTable(LOOKUP_TABLE_ADDRESS: PublicKey, mint: PublicKey) {
    const programId = cluster == "devnet" ? DEVNET_PROGRAM_ID : MAINNET_PROGRAM_ID

    const wallets = readBundlerWallets(bundlerWalletName)

    const walletKPs: Keypair[] = wallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
    const walletPKs: PublicKey[] = wallets.map((wallet: string) => (Keypair.fromSecretKey(bs58.decode(wallet))).publicKey);

    try {// Step 1 - Adding bundler wallets
      
    }
    catch (err) {
        console.log("There is an error in adding addresses in LUT. Please retry it.")
        mainMenuWaiting()
        return;
    }
}

const createAtas = async (wallets: Keypair[], baseMint: PublicKey) => {
    try {
       
    } catch (error) {
        console.log("Prepare Ata creation error:", error)
        return
    }
}

export const create_extend_lut_ata = async () => {

    const wallets = readBundlerWallets(bundlerWalletName)
    const walletKPs = wallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
    const data = readJson()
    const mint = new PublicKey(data.mint!)


    console.log(wallets);
    console.log(walletKPs);
    console.log(data);
    console.log("mint", mint);


    try {
       
    } catch (err) {
        console.log("Error occurred in creating lookuptable. Please retry this again.")
        mainMenuWaiting()
    }

}