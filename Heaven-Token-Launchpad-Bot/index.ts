import { buyToken, createToken, sellToken, sleep, getTokenMetadata } from "./utils";

async function main() {
  try {
    console.log("🚀 Starting Heaven DEX Token Launchpad Bot...");
    console.log("👨‍💻 Developer: TopSecretAgent007");
    console.log("📱 Telegram: @topsecretagent_007");
    console.log("🐦 Twitter: @lendon1114");
    console.log("🐙 GitHub: @topsecretagent007");
    console.log("\n" + "=".repeat(60) + "\n");

    // 1️⃣ Create Token
    console.log("🪙 Step 1: Creating new token...");
    const createResult = await createToken();
    if (!createResult?.mint) {
      throw new Error("❌ Token creation failed: no mint address returned");
    }
    console.log(`✅ Token created successfully!`);
    console.log(`📍 Mint Address: ${createResult.mint.toBase58()}`);
    console.log(`🏦 Token Account: ${createResult.tokenAccount.toBase58()}`);

    // Get token metadata
    const metadata = await getTokenMetadata(createResult.mint);
    if (metadata) {
      console.log(`📋 Token Info: ${metadata.name} (${metadata.symbol})`);
    }

    console.log("\n" + "=".repeat(60) + "\n");
    await sleep(2000);

    // 2️⃣ Buy Token
    console.log("💰 Step 2: Buying tokens...");
    const buyResult = await buyToken(createResult.mint, 0.005);
    if (!buyResult) {
      throw new Error("❌ Buy transaction failed");
    }
    console.log("✅ Buy transaction completed successfully!");

    console.log("\n" + "=".repeat(60) + "\n");
    await sleep(2000);

    // 3️⃣ Sell Token
    console.log("💸 Step 3: Selling tokens...");
    const sellResult = await sellToken(createResult.mint, 1000);
    if (!sellResult) {
      throw new Error("❌ Sell transaction failed");
    }
    console.log("✅ Sell transaction completed successfully!");

    console.log("\n" + "=".repeat(60) + "\n");
    console.log("🎉 Token lifecycle completed successfully!");
    console.log("🚀 Heaven DEX Token Launchpad Bot finished!");
    
  } catch (err) {
    console.error("❌ Error in main workflow:", err);
    process.exit(1); // Exit with failure code for CI/Prod
  }
}

main();
