import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction, Connection } from "@solana/web3.js";
import { newSendToken } from "../src/sendBulkToken";
import { Data, mainMenuWaiting, readBundlerWallets, readJson, saveBundlerWalletsToFile, saveHolderWalletsToFile, sleep } from "../src/utils";
import { connection } from "../config";
import { LP_wallet_private_key, bundlerWalletName, bundleWalletNum, needNewWallets } from "../settings"
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import bs58 from 'bs58'
import { screen_clear } from "../menu/menu";
import { execute } from "../src/legacy";
import { wallet1, wallet2, wallet3, wallet4, wallet5, wallet6, wallet7, wallet8, wallet9, wallet10, wallet11, wallet12, wallet13, wallet14, wallet15, wallet16, wallet17, wallet18, wallet19, wallet20, wallet21, quote_Mint_amount } from "../settings"
const walletNum = bundleWalletNum
export const wallet_create = async () => {
  screen_clear()
  console.log(`Creating ${walletNum} Wallets for bundle buy`);

  let wallets: string[] = []
  let swapSolAmount = calcWalletSol()
  console.log("swapSolAmount=======================>", swapSolAmount);
  if (needNewWallets) {
    // Step 1 - creating bundler wallets
    try {
      

      await sleep(2000)
    } catch (error) { console.log(error) }
    console.log("🚀 ~ Bundler wallets: ", wallets)
  }

  const savedWallets = readBundlerWallets(bundlerWalletName)
  // console.log("🚀 ~ savedWallets: ", savedWallets)

  // Step 2 - distributing sol to bundler wallets
  console.log("Distributing sol to bundler wallets...")

  const walletKPs = savedWallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
  const data = readJson()
  const LP_wallet_keypair = Keypair.fromSecretKey(bs58.decode(data.mainKp!))

  // 20 wallets sol airdrop transaction
  try {
   
  } catch (error) {
    console.log("Failed to transfer SOL", error)
  }

  mainMenuWaiting()
}

