import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { newSendToken } from "../src/sendBulkToken";
import { Data, mainMenuWaiting, readBundlerWallets, readJson, saveBundlerWalletsToFile, saveHolderWalletsToFile, saveSwapSolAmountToFile, sleep } from "../src/utils";
import { connection } from "../config";
import { bundlerWalletName, bundleWalletNum, needNewWallets, swapSolAmountMax, swapSolAmountMin } from "../settings"
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import bs58 from 'bs58'
import { screen_clear } from "../menu/menu";
import { execute } from "../src/legacy";

const walletNum = bundleWalletNum

export const wallet_create = async () => {
  screen_clear()
  console.log(`Creating ${walletNum} Wallets for bundle buy`);

  let solAmountArray: number[] = []
  let wallets: string[] = []


  mainMenuWaiting()
}
