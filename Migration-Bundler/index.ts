import { Keypair } from "@solana/web3.js";
import base58 from "bs58";
import { sleep, saveDataToFile } from "./utils";
import { parseTaskCSV, convertWalletsToObject } from "./utils/csvParser";
import { getCreateTokenDevBuyTx } from "./createBuy";
import { getMigrationBuyTx } from "./migrationBuy";
import { getBuyTx } from "./buy";
import { connection, MIGRATION_BUY_AMOUNT, MINT_WALLET_PRIVATE, SLIPPAGE } from "./constants";
import { simulateBundle } from "./executor/jito";
import { executeJitTx } from "./executor/jito";

export const init = async () => {
  try {
    const mintKp = Keypair.generate();
    const mintWalletKp = Keypair.fromSecretKey(
      base58.decode(MINT_WALLET_PRIVATE)
    );

    console.log("Mint Wallet: ", mintWalletKp.publicKey.toBase58());
    console.log("Token Mint: ", mintKp.publicKey.toBase58());

    // Read all wallet data from unified task.csv file
    const taskData = parseTaskCSV("task.csv");

    const buyWallets_1 = convertWalletsToObject(taskData.wallets.group1);
    const buyWallets_2 = convertWalletsToObject(taskData.wallets.group2);
    const buyWallets_3 = convertWalletsToObject(taskData.wallets.group3);

    // Save the private keys of the loaded wallets to bundlerWallets.json
    const walletPrivateKeys_1 = Object.keys(buyWallets_1);
    saveDataToFile(walletPrivateKeys_1, "bundlerWallets_1.json");
    const walletPrivateKeys_2 = Object.keys(buyWallets_2);
    saveDataToFile(walletPrivateKeys_2, "bundlerWallets_2.json");
    const walletPrivateKeys_3 = Object.keys(buyWallets_3);
    saveDataToFile(walletPrivateKeys_3, "bundlerWallets_3.json");

    console.log("Pumpfun Pumpswap Migration Bundler Launchpad");
    console.log(`Loaded from task.csv: mint wallet and ${Object.keys(buyWallets_1).length + Object.keys(buyWallets_2).length + Object.keys(buyWallets_3).length} wallets (group1: ${Object.keys(buyWallets_1).length}, group2: ${Object.keys(buyWallets_2).length}, group3: ${Object.keys(buyWallets_3).length}) and saved private keys to bundlerWallets.json`);
    
    const createBuyTx = await getCreateTokenDevBuyTx(mintKp, mintWalletKp);
    const migrateTx = await getMigrationBuyTx(mintKp.publicKey, mintWalletKp.publicKey, MIGRATION_BUY_AMOUNT, SLIPPAGE);
    const buyTx1 = await getBuyTx(mintKp.publicKey, mintWalletKp.publicKey, Object.keys(buyWallets_1).map(key => Keypair.fromSecretKey(base58.decode(key))), Object.values(buyWallets_1), SLIPPAGE);
    const buyTx2 = await getBuyTx(mintKp.publicKey, mintWalletKp.publicKey, Object.keys(buyWallets_2).map(key => Keypair.fromSecretKey(base58.decode(key))), Object.values(buyWallets_2), SLIPPAGE);
    const buyTx3 = await getBuyTx(mintKp.publicKey, mintWalletKp.publicKey, Object.keys(buyWallets_3).map(key => Keypair.fromSecretKey(base58.decode(key))), Object.values(buyWallets_3), SLIPPAGE);
    
    const transactions = [createBuyTx, migrateTx.tx, buyTx1.tx, buyTx2.tx, buyTx3.tx];

    const signedBufferedTxs = transactions.map((tx) => {
      return Buffer.from(tx.serialize());
    });
    const encodedForSimulation = signedBufferedTxs.map((buf) =>
      buf.toString("base64")
    );

    transactions.forEach(async (tx) => {
      console.log(await connection.simulateTransaction(tx))
    })

    const simulateResult = await simulateBundle(encodedForSimulation);
    if (simulateResult) {
      const bundleId = await executeJitTx(encodedForSimulation);
      console.log("Bundle ID: ", bundleId);
      console.log(`Pumpfun Token Launched Successfully: https://solscan.io/token/${mintKp.publicKey.toBase58()}`);
    } else {
      console.log("Simulation failed");
    }
  } catch (error) {
    console.log(error);
  }
};

init();
