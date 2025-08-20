import readline from "readline"
import fs from "fs";

import { cluster } from "./config"
import { retrieveEnvVariable, sleep } from "./src/utils"
import {
  getWalletTokenAccount,
} from "./src/get_balance";

import { main_menu_display, rl, screen_clear, security_checks_display } from "./menu/menu";
import { create_token } from "./layout/createToken";
import { create_market } from "./layout/createMarket";
import { revokeMintAuthority } from "./src/revokeMintAuthority";
import { revokeFreezeAuthority } from "./src/revokeFreezeAuthority";
import { bundle_pool_buy } from "./layout/poolBuy";
import { burn_lp } from "./src/burnLp";
import { manual_all_sell } from "./layout/manualAllSell";
import { wallet_create } from "./layout/walletCreate";
import { create_atas } from "./layout/createAta";
import { simulate } from "./layout/simulation";
import { sol_gather } from "./layout/solGather";
import { create_extend_lut } from "./layout/createLut";
import { remove_liquidity } from "./layout/removeLiquidity";
// import { manualRebuy } from "./layout/rebuy";
// import { holderDistribute } from "./layout/holderDistribute";

type WalletTokenAccounts = Awaited<ReturnType<typeof getWalletTokenAccount>>

// export const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// })

export const init = () => {
  screen_clear();

  main_menu_display();

  rl.question("\t[Main] - Choice: ", (answer: string) => {
    let choice = parseInt(answer);
    switch (choice) {
      case 1:
        
      default:
        console.log("\tInvalid choice!");
        sleep(1500);
        init();
        break;
    }
  })
}

export const security_checks = () => {
  screen_clear();
  console.log("Security Checks")
  security_checks_display();

  rl.question("\t[Security Checks] - Choice: ", (answer: string) => {
    let choice = parseInt(answer);
    switch (choice) {
      case 1:

      default:
        console.log("\tInvalid choice!");
        sleep(1500);
        security_checks();
        break;
    }
  })
}

init()