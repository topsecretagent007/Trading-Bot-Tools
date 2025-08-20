import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, createTransferCheckedInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { DEBUG_MODE, Keys } from "../../module";
import { sleep } from "../../module/utils";

export const volumeGather = async (keysData: Keys) => {
  try {
    const { volumes, mainKp, mintPk } = keysData;
    const connection = new Connection(process.env.RPC_ENDPOINT || "https://api.mainnet-beta.solana.com");

    console.log("Starting volume gather process...");

    // Gather SOL from volume wallets
    for (let i = 0; i < volumes.length; i++) {
      try {
        const wallet = volumes[i];
        const balance = await connection.getBalance(wallet.publicKey);
        
        if (balance > 0.001 * LAMPORTS_PER_SOL) {
          const transferAmount = balance - 0.0005 * LAMPORTS_PER_SOL; // Leave some for fees
          
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: mainKp.publicKey,
              lamports: transferAmount
            })
          );

          const latestBlockhash = await connection.getLatestBlockhash();
          transaction.feePayer = wallet.publicKey;
          transaction.recentBlockhash = latestBlockhash.blockhash;

          const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
          console.log(`Gathered ${(transferAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL from volume wallet ${i + 1}: ${signature}`);
        }

        // Gather tokens if any
        const tokenAccount = getAssociatedTokenAddressSync(mintPk, wallet.publicKey);
        const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);
        
        if (tokenBalance.value.uiAmount && tokenBalance.value.uiAmount > 0) {
          const mainTokenAccount = getAssociatedTokenAddressSync(mintPk, mainKp.publicKey);
          
          const transferInstruction = createTransferCheckedInstruction(
            tokenAccount,
            mintPk,
            mainTokenAccount,
            wallet.publicKey,
            tokenBalance.value.amount,
            tokenBalance.value.decimals
          );

          const transaction = new Transaction().add(transferInstruction);
          const latestBlockhash = await connection.getLatestBlockhash();
          transaction.feePayer = wallet.publicKey;
          transaction.recentBlockhash = latestBlockhash.blockhash;

          const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
          console.log(`Gathered ${tokenBalance.value.uiAmount} tokens from volume wallet ${i + 1}: ${signature}`);
        }

        await sleep(1000); // Wait between transactions
      } catch (error) {
        console.log(`Error gathering from volume wallet ${i + 1}:`);
        if (DEBUG_MODE) console.log(error);
      }
    }

    console.log("Volume gather process completed!");
  } catch (error) {
    console.log("Error in volume gather process:");
    if (DEBUG_MODE) console.log(error);
  }
}; 