import {
  Commitment,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import base58 from "bs58";

import { maker } from "./process_maker/maker";
import { volume } from "./process_volume/volume";
import { makerGather } from "./process_maker/gather";
import { volumeGather } from "./process_volume/gather";
import {
  BUYER_SOL_AMOUNT,
  COMMITMENT,
  DEBUG_MODE,
  MAKER_WALLET_NUM,
  MINT_TO_MANUAL_GATHER,
  MAIN_WALLET_PRIVATE_KEY,
  RETRY_MODE,
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
  VOLUME_WALLET_NUM,
  TOKEN_DISTRIBUTION_WALLET_NUM,
} from "../module/configs";
import {
  makeAndSaveKeys,
  importKeysFromFile,
  Keys,
  checkBundleResult,
  transferSol,
  transferToMain,
  validate,
  sleep,
  ITokenInfo,
  initLogsFile,
  extendLogsFile,
} from "../module/utils";

export const pumpProcess = async (tokenMetaData: ITokenInfo) => {
  try {
    // Initialize connection and main wallet
    const connection = new Connection(RPC_ENDPOINT, COMMITMENT);
    const mainKp = Keypair.fromSecretKey(base58.decode(MAIN_WALLET_PRIVATE_KEY));
    
    // set token data accordingly in the current script
    console.log("token data", tokenMetaData);

    // Make keypairs for token process
    let keysData: Keys;
    if (RETRY_MODE) {
      const data = importKeysFromFile(tokenMetaData.symbol);
      if (!data) return;
      keysData = data;
    } else {
      keysData = makeAndSaveKeys(
        MAKER_WALLET_NUM,
        VOLUME_WALLET_NUM,
        TOKEN_DISTRIBUTION_WALLET_NUM
      );
    }

    const mintAddress = keysData.mintPk.toBase58();
    initLogsFile(mintAddress, `logs initiated for${mintAddress}`);

    // Get main wallet balance
    const mainBal = await connection.getBalance(mainKp.publicKey);
    
    // Print the main wallet balance
    console.log(
      "SOL balance in main wallet is ",
      (mainBal / 10 ** 9).toFixed(3)
    );
    initLogsFile(
      mintAddress,
      `SOL balance in main wallet is ${(mainBal / 10 ** 9).toFixed(3)}`
    );
    console.log("Mint address for token : ", keysData.mintPk.toBase58());
    initLogsFile(
      mintAddress,
      `Mint address for token : ${keysData.mintPk.toBase58()}`
    );

    // Transfer SOL to token wallet, (BUYER_SOL to token wallet)
    const wallet = keysData.mainKp;
    const sig = await transferSol(
      connection,
      mainKp,
      wallet.publicKey,
      Math.floor(BUYER_SOL_AMOUNT * LAMPORTS_PER_SOL)
    );
    if (!sig) return;
    console.log(
      `Transfer for token process success: https://solscan.io/tx/${sig}`
    );
    extendLogsFile(
      mintAddress,
      `Transfer for token process success: https://solscan.io/tx/${sig}`
    );

    // Bundling part
    for (let i = 0; i < 3; i++) {
      await sleep(5000);
        maker(keysData);
        volume(keysData);
        break
        if (i == 2) {
          extendLogsFile(
            mintAddress,
            "============== Bundle failed, gathering and exiting... =============="
          );
          console.log(
            "============== Bundle failed, gathering and exiting... =============="
          );
        } else {
          console.log(
            "============== Bundle failed, retrying... =============="
          );
        }
    }

    // Gather all funds back to token wallet
    await Promise.all([
      makerGather(keysData),
      volumeGather(keysData),
    ]);

    // double check funds in keypairs

    const keys = [
      ...keysData.bundlers,
      ...keysData.makers,
      ...keysData.volumes,
    ];
    // Note: gather function is not implemented, skipping for now
    await sleep(5000);

    // Transfer token wallet's fund back to main wallet
    const gatherSig = await transferToMain(connection, wallet, mainKp, keysData.mintPk);
    console.log(
      `Token process ended and gathered the fund back to main wallet https://solscan.io/tx/${gatherSig}`
    );
    extendLogsFile(
      mintAddress,
      `Token process ended and gathered the fund back to main wallet https://solscan.io/tx/${gatherSig}`
    );

    return "Pump process completed successfully!";
  } catch (error) {
    console.log("Error in token process");

    if (DEBUG_MODE) console.log(error);
  }
};

// workerpool.worker({
//   executeScript: pumpProcess,
// });
