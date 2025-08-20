import {
  Connection,
  Keypair,
  AddressLookupTableProgram,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";

import bs58 from "bs58";

import { PRIVATE_KEY, RPC_ENDPOINT, BAGS_FM_PROGRAM_ID } from "./constants";
import { createExtendLut, createLutInst } from "./src/LUT";
import { createTokenTx } from "./src/token";
import { makeBuyTx } from "./src/buy";
import { distributeSol } from "./src/distribute";
import { jitoWithAxios } from "./executor/jitoWithAxios";
import { saveLUTFile } from "./utils";

const main = async () => {
  console.log("🚀 Starting Bags.fm Bundler Bot...");
  console.log("📊 Program ID:", BAGS_FM_PROGRAM_ID);
  
  try {
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const mainKp = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    
    console.log("🔑 Main wallet:", mainKp.publicKey.toBase58());
    
    const solAmount = 1000000; // 0.001 SOL per wallet
    const buyerKps: Keypair[] = [];
    
    // Generate buyer wallets
    for(let i = 0; i < 4; i++) {
      buyerKps.push(Keypair.generate());
      console.log(`👤 Buyer ${i + 1}: ${buyerKps[i].publicKey.toBase58()}`);
    }
    
    const buyerPubkeys: PublicKey[] = buyerKps.map(kp => kp.publicKey);
    const mintKp = Keypair.generate();
    
    console.log("🪙 Token mint:", mintKp.publicKey.toBase58());
    
    // Create Address Lookup Table
    console.log("🔍 Creating Address Lookup Table...");
    const slot = await connection.getSlot();
    const [lookupTableInst, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
      authority: mainKp.publicKey,
      payer: mainKp.publicKey,
      recentSlot: slot - 1
    });
    
    console.log("✅ Lookup table instruction created");
    console.log("📍 Lookup table address:", lookupTableAddress.toBase58());

    // Save LUT address to file
    if (lookupTableInst && lookupTableAddress) {
      try {
        saveLUTFile(lookupTableAddress.toBase58());
        console.log("💾 LUT address saved to file");
      } catch (err) {
        console.log("⚠️ Warning: Failed to save LUT address:", err);
      }
    }

    // Initialize LUT
    console.log("🔧 Initializing Lookup Table...");
    const lutInst = await createLutInst(connection, mainKp, lookupTableInst);
    console.log("✅ LUT initialized");
    
    // Extend LUT with buyer addresses
    console.log("📝 Extending Lookup Table with buyer addresses...");
    const extendLut = await createExtendLut(connection, mainKp, lookupTableAddress, buyerPubkeys, mintKp.publicKey);
    console.log("✅ LUT extended");

    // Distribute SOL to buyer wallets
    console.log("💰 Distributing SOL to buyer wallets...");
    const distribute = await distributeSol(connection, mainKp, buyerKps, solAmount);
    console.log("✅ SOL distributed");

    // Create token
    console.log("🪙 Creating token...");
    const createTx = await createTokenTx(connection, mainKp, mintKp);
    console.log("✅ Token created");
    
    // Get buy transactions for bundling
    console.log("🔄 Creating buy transactions...");
    const buyTxs = await makeBuyTx(connection, mintKp, buyerKps, lookupTableAddress);
    console.log(`✅ Created ${buyTxs.transactions.length} buy transactions`);

    // Bundle and send transactions
    console.log("📦 Bundling transactions...");
    try {
      const bundleTx: VersionedTransaction[] = [];
      
      // Add create token transaction
      if (createTx) {
        bundleTx.push(createTx);
        console.log("➕ Added token creation transaction to bundle");
      }
      
      // Add buy transactions
      if (buyTxs && Array.isArray(buyTxs.transactions)) {
        buyTxs.transactions.forEach((tx, index) => {
          const txSize = tx.serialize().length;
          console.log(`📏 Transaction ${index + 1} size: ${txSize} bytes`);
        });
        bundleTx.push(...buyTxs.transactions);
        console.log(`➕ Added ${buyTxs.transactions.length} buy transactions to bundle`);
      }
      
      console.log(`📦 Total transactions in bundle: ${bundleTx.length}`);

      // Execute the bundle using Jito
      console.log("🚀 Executing bundle with Jito MEV protection...");
      const result = await jitoWithAxios(bundleTx, mainKp);
      
      if (result.confirmed) {
        console.log("✅ Bundle executed successfully!");
        console.log("🔗 Transaction signature:", result.createAndjitoFeeTx);
        console.log("🌐 View on Solscan: https://solscan.io/tx/" + result.createAndjitoFeeTx);
      } else {
        console.log("❌ Bundle execution failed");
      }
      
    } catch (err) {
      console.error("💥 Error in bundling:", err);
    }
    
    console.log("🎉 Bags.fm Bundler Bot execution completed!");
    
  } catch (error) {
    console.error("💥 Fatal error in main:", error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

main();