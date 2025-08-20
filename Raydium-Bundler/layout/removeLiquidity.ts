import { PublicKey } from "@solana/web3.js"

import { tokens } from "../settings"
import { mainMenuWaiting, outputBalance, readJson, saveDataToFile, sleep } from "../src/utils"
import { getWalletTokenAccount } from "../src/get_balance";
import { LP_wallet_keypair } from "../settings";
import { ammRemoveLiquidity } from "../src/removeLiquidity";
import { init } from "..";

type WalletTokenAccounts = Awaited<ReturnType<typeof getWalletTokenAccount>>

const execute = async () => {
 
}

export const remove_liquidity = async () => {
  for (let i = 0; i < tokens.length; i++) {
    console.log(`Token ${i + 1} Liquidity Removed`)
    await execute()
    console.log("One token remove process is ended, and go for next one")
    await sleep(10000)
    mainMenuWaiting()
  }
}

// remove_liquidity()
