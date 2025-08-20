import { Commitment, Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import UserModel from "../database/model"
import { Swap } from "../module/volume/swap";
import { COMMITMENT, RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT } from "../config";
import base58 from "bs58";
import { jupiterSwap } from "../module/volume/jupiterSwap";
import { amount } from "@metaplex-foundation/js";
import { getTokenBalance } from "../utils";



const connection = new Connection(RPC_ENDPOINT);

export const volumeBuy = async (chatId: number) => {
    let sigs: string[] = [];
    let buyTokenName = "";
    let buyTokenTicker = "";
    let buyTokenAddress = "";
    let buyTokenAmount = 0;
    let buyTokenPrice = 0;
    let buyTokenLiq = 0;
    let buyTokenMc = 0;
    let walletAddress = "";
    let balance = 0;

    try {
        const userInfo = await UserModel.findOne({ userId: chatId });
        if (!userInfo) {
            throw new Error("User not found. Please register first.");
        }

        const mainKp = Keypair.fromSecretKey(base58.decode(userInfo.privateKey));
        const jSwap = new jupiterSwap(connection, mainKp);

        if (!userInfo.buyToken || userInfo.buyToken.length === 0) {
            throw new Error("Please set a token to buy.");
        }

        for (const token of userInfo.buyToken) {
            buyTokenName = token.name || "Unknown";
            buyTokenTicker = token.ticker || "N/A";
            buyTokenAddress = token.address || "N/A";
            buyTokenAmount = token.amount || 0;
            buyTokenPrice = token.price || 0;
            buyTokenLiq = token.liq || 0;
            buyTokenMc = token.mc || 0;
            walletAddress = token.wallets?.[0]?.address || "N/A";

            console.log("token-->", token);
            let sig: string;
            const buyTx = await jSwap.buy(mainKp, new PublicKey(token.address), buyTokenAmount * 1e9);
            console.log("buy-->", buyTx);

            sig = token.mevProtect
                ? await jSwap.execute(buyTx, true)
                : await jSwap.executeJitoTx(buyTx, COMMITMENT as Commitment);

            sigs.push(sig);
        }

        // Fetch SOL balance
        if (walletAddress !== "N/A") {
            try {
                const solBalance = await connection.getBalance(new PublicKey(walletAddress));
                balance = solBalance / 1e9; // Convert lamports to SOL
            } catch (error) {
                console.log("Error fetching SOL balance:", error);
            }
        }

        const title = ` ⚡️ <b>Lynx Buy</b> ⚡️

Buy 💲<b>${buyTokenName}</b> - (<b>${buyTokenTicker}</b>) 🪙  
<code>💲 ${buyTokenAddress}</code>  
💲<a href="https://t.me/dontg_trading_bot?=r-${buyTokenName}-${buyTokenAddress}" target="_blank">Share using your Referral Link</a>  

<b>💰 Current Price: $${buyTokenPrice}</b> - <b>LIQ: ${buyTokenLiq}</b> - <b>MC: ${buyTokenMc}</b>  

🎉 Congratulations, you have purchased ${buyTokenAmount} tokens.  

💳 <code>${walletAddress}</code>  
💰 ${balance} SOL  
        `;

        const content = [[{ text: '🔙 Back', callback_data: 'back-to-main' }]];

        return { title, content };
    } catch (error) {
        console.error("Error in volumeBuy:", error);

        const title = ` ❌ <b>Sorry, your transaction has failed.</b>  

💡 Please try again. Enter the correct token and amount.`;

        const content = [[{ text: '🔙 Back', callback_data: 'back-to-main' }]];

        return { title, content }; // ✅ Always returning a valid object
    }
};


export const volumeSell = async (chatId: Number) => {
    let sigs: string[] = [];
    let sellTokenName = "";
    let sellTokenTicker = "";
    let sellTokenAddress = "";
    let sellTokenAmount = 0;
    let balance = 0;

    try {
        const userInfo = await UserModel.findOne({ userId: chatId });
        if (!userInfo) {
            throw new Error("User not found. Please register first.");
        }

        const mainKp = Keypair.fromSecretKey(base58.decode(userInfo.privateKey));
        const jSwap = new jupiterSwap(connection, mainKp);

        if (!userInfo.sellToken || userInfo.sellToken.length === 0) {
            throw new Error("Please set a token to sell.");
        }

        for (const token of userInfo.sellToken) {
            sellTokenName = token.name || "Unknown";
            sellTokenTicker = token.ticker || "N/A";
            sellTokenAddress = token.address || "N/A";
            sellTokenAmount = token.amount || 0;

            const balance = await getTokenBalance(connection, mainKp.publicKey, token.address);
            console.log("token-->", token);
            if (!balance || balance <= 0) continue;
            let sig: string;
            const sellTx = await jSwap.sell(mainKp, new PublicKey(token.address), sellTokenAmount * (balance / 100));
            console.log("sell-->", sellTx);

            sig = token.mevProtect
                ? await jSwap.execute(sellTx, true)
                : await jSwap.executeJitoTx(sellTx, COMMITMENT as Commitment);

            sigs.push(sig);
        }

        const title = ` ⚡️ <b>Lynx Sell</b> ⚡️

Sell 💲<b>${sellTokenName}</b> - (<b>${sellTokenTicker}</b>) 🪙  
<code>💲 ${sellTokenAddress}</code>  

🎉 You have successfully sold ${sellTokenAmount} tokens.

        `;

        const content = [[{ text: '🔙 Back', callback_data: 'back-to-main' }]];

        return { title, content };
    } catch (error) {
        console.error("Error in volumeSell:", error);

        const title = ` ❌ <b>Sorry, your transaction has failed.</b>  
💡 Please try again. Ensure you have enough balance to sell.`;

        const content = [[{ text: '🔙 Back', callback_data: 'back-to-main' }]];

        return { title, content };
    }
};
