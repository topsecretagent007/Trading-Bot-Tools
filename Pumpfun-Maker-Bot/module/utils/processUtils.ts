import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  BUNDLE_SLIPPAGE,
  BUYER_SOL_AMOUNT,
  DEBUG_MODE,
  SWAP_AMOUNT_MAX,
  SWAP_AMOUNT_MIN,
  SWAP_AMOUNT_TOTAL,
  TOKEN_DISTRIBUTION_WALLET_NUM,
} from "../configs";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keys } from "./interface";
import { extendLogsFile } from "./utils";

export const transferSol = async (
  connection: Connection,
  from: Keypair,
  to: PublicKey,
  amount: number
) => {
  try {
    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: amount,
      })
    );
    tx.feePayer = from.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const sig = await sendAndConfirmTransaction(connection, tx, [from], { commitment: "confirmed" });
    return sig;
  } catch (error) {
    console.log("Error in SOL transfer");
    if (DEBUG_MODE) console.log(error);
    return;
  }
};

export const transferToMain = async (
  connection: Connection,
  tokenWallet: Keypair,
  mainWallet: Keypair,
  mint: PublicKey
) => {
  try {
    const resultBal = await connection.getBalance(tokenWallet.publicKey);
    const solUsedInTokenProcess = (BUYER_SOL_AMOUNT - resultBal / 10 ** 9).toFixed(3)
    console.log("Total SOL used in token process is ", solUsedInTokenProcess, "SOL")
    extendLogsFile(
      mint.toBase58(),
      `Total SOL used in token process is ${solUsedInTokenProcess}SOL`
    );
    const gatherTx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
      SystemProgram.transfer({
        fromPubkey: tokenWallet.publicKey,
        toPubkey: mainWallet.publicKey,
        lamports: resultBal,
      })
    );
    gatherTx.feePayer = mainWallet.publicKey;
    gatherTx.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    const gatherSig = await sendAndConfirmTransaction(connection, gatherTx, [
      tokenWallet,
      mainWallet,
    ]);
    return gatherSig;
  } catch (error) {
    console.log("Error in SOL transfer");
    if (DEBUG_MODE) console.log(error);
    return;
  }
};

export const checkBundleResult = async (
  connection: Connection,
  keysData: Keys
) => {
  try {
    const mint = keysData.mintPk;
    const bundleWalletKp = keysData.bundlers[0];
    const ata = getAssociatedTokenAddressSync(mint, bundleWalletKp.publicKey);
    const info = await connection.getAccountInfo(ata);
    if (info) {
      const balance = (await connection.getTokenAccountBalance(ata)).value
        .uiAmount;
      console.log("One of the bundled wallet has token balance of ", balance);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    //@ts-ignore
    console.log("Error while checking the bundle result", error?.message);
    return false;
  }
};

export const validate = (mainBal: number) => {
  // check bundling amount sum
  if (BUYER_SOL_AMOUNT * 10 ** 9 > mainBal) {
    console.log("Insufficient main balance")
    return false
  }

  if (SWAP_AMOUNT_MAX * 20 < SWAP_AMOUNT_TOTAL) {
    console.log(SWAP_AMOUNT_MAX * 20);
    console.log(
      "Invalid env setting for bundling: max bundle amount * wallet num must be greater than or equal to total."
    );
    return false;
  }

  if (SWAP_AMOUNT_MIN * 20 > SWAP_AMOUNT_TOTAL) {
    console.log(SWAP_AMOUNT_MIN);
    console.log(SWAP_AMOUNT_TOTAL);
    console.log(SWAP_AMOUNT_MIN * 20);
    console.log(
      "Invalid env setting for bundling: min bundle amount * wallet num must be less than or equal to total."
    );
    return false;
  }

  if (
    mainBal < BUYER_SOL_AMOUNT * 10 ** 9 &&
    BUYER_SOL_AMOUNT * 10 ** 9 <
    SWAP_AMOUNT_TOTAL * LAMPORTS_PER_SOL * (1 + BUNDLE_SLIPPAGE / 100) +
    10 ** 8 +
    2039280 * (Math.ceil(TOKEN_DISTRIBUTION_WALLET_NUM / 20) + 1)
  ) {
    console.log("Main balance is not enough to run the token");
    return false;
  }

  if (SWAP_AMOUNT_TOTAL + 0.2 > BUYER_SOL_AMOUNT) {
    console.log(
      "Env setting for swap_total_amount and wallet_balance_buyer_sol_amount is not valid"
    );
    return false;
  }
  return true;
};
