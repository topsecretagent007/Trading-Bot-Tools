import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { initialUserInfo } from "../constants"
import { Metaplex } from "@metaplex-foundation/js";
import { helper } from "../database"
import base58 from "bs58"
import { RPC_ENDPOINT } from "../config"
import { getMint, getAccount } from "@solana/spl-token";
import { startSniperBot } from "../module/sniping";
import UserModel from "../database/model";
// import fetch from 'node-fetch';

const fetch = require('node-fetch');

const connection = new Connection(RPC_ENDPOINT);
const metaplex = Metaplex.make(connection);

export const welcome = async (chatId: number, username: string) => {
  console.log(`${username} : ${chatId} => Welcome page entered`);

  let userInfo = await helper.findUser(chatId);
  let mainWallet = await helper.findOne(chatId);
  let mainWalletPublic = "";
  let mainWalletPrivate = "";

  if (!userInfo) {
    console.log(`${username} : ${chatId} => Failed to fetch the user info from DB`);
    await helper.saveInfo(chatId, {
      userId: chatId, username, ...initialUserInfo,
      buyToken: [],
      allWallets: [],
      sellToken: []
    });
  }

  // If wallet exists, use the existing keys
  if (mainWallet?.publicKey && mainWallet?.publicKey !== "") {
    mainWalletPublic = `<code>${mainWallet?.publicKey}</code>\n`;
  }

  if (mainWallet?.privateKey && mainWallet?.privateKey !== "") {
    mainWalletPrivate = `<code>${mainWallet?.privateKey}</code>\n`;
  }

  // If no wallet exists, generate a new one
  if (!mainWallet?.publicKey || !mainWallet?.privateKey) {
    const keypair = Keypair.generate();
    const newPrivateKey = base58.encode(keypair.secretKey);
    const newPublicKey = keypair.publicKey.toBase58();

    // Store new wallet details
    await helper.setWallet(chatId, newPrivateKey, newPublicKey);

    mainWalletPublic = `<code>${newPublicKey}</code>\n`;
    mainWalletPrivate = `<code>${newPrivateKey}</code>\n`;
  }

  const title = `🐾  <b>Welcome to Lynx!</b>

Trade smarter, faster, sharper.

🟢 Your Lynx Wallet is Ready! 

Below is your private key and wallet address. Please secure them safely—your trading future depends on it.

🔑  <b>Private Key:</b>
${mainWalletPrivate}

🚨 <b>Important:</b> This key will not be shown again. Do not share it with anyone.
    
💼 Your <b>Solana</b> Wallet Address:
${mainWalletPublic}

💡 <b>How to Begin:</b>

Deposit SOL to your wallet address using the Solana network.
Access the powerful features Lynx offers.
Start trading smarter and faster today!
    
📘 <b>Helpful Links:</b>

• 🛠 <a href="https://docs.lynxbot.cc" target="_blank" ><b>Lynx Docs</b></a>
• ✖️ <a href="https://x.com/lynxonsolana" target="_blank"><b>Lynx X</b></a>
• 🤝 <a href=""><b>Lynx Portal</b></a>
    
⚡️ <b>Let’s Begin:</b> Take control of your trades and let Lynx do the rest. Tap below to dive in!
      `;

  const content = [
    [{ text: '🚀 Start Trading', callback_data: 'back-to-main' }],
  ];

  return { title, content };
};

export const welcomeDashboard = async (chatId: number, username: string) => {
  console.log(`${username} : ${chatId} => Welcome page entered`)
  let userInfo = await helper.findUser(chatId)
  let mainWallet = await helper.findOne(chatId);
  let mainWalletData = "";
  let solUsdPrice = 0;
  let balance = 0;
  let usdBalance = 0;

  if (!userInfo) {
    console.log(`${username} : ${chatId} => Failed to fetch the user info from DB`)
    await helper.saveInfo(chatId, {
      userId: chatId, username, ...initialUserInfo,
      buyToken: [],
      allWallets: [],
      sellToken: []
    })
  }

  if (mainWallet?.publicKey && mainWallet?.publicKey !== "") {
    mainWalletData = `💳 <code>${mainWallet?.publicKey}</code>\n`;
  }

  if (mainWallet?.publicKey) {
    try {
      const solBalance = await connection.getBalance(new PublicKey(mainWallet.publicKey));
      balance = solBalance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.log("Error happened while fetching SOL balance:", error);
    }
  }

  try {
    // Define the expected API response type
    interface SolanaPriceResponse {
      solana: {
        usd: number;
      };
    }

    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = (await response.json()) as SolanaPriceResponse; // Explicitly cast 'data' to SolanaPriceResponse

    solUsdPrice = data.solana.usd;
  } catch (error) {
    console.log("Error fetching SOL price:", error);
  }

  usdBalance = balance * solUsdPrice;

  if (mainWalletData === "") {
    const title = `🐾  <b>Welcome to Lynx!</b>
    
💡 Currently, Manage Wallet is not set up. Please set the value.
      `
    const content = [
      [{ text: '⚙️ Manage Wallet', callback_data: 'manage-wallet' }]
    ]
    return { title, content }
  } else {
    const title = `🐾  <b>Welcome to Lynx!</b>

Trade smarter, faster, sharper.
    
💼 Your <b>Solana</b> Wallet Address:
<code>${mainWalletData}</code>
💰 Balance: ${balance} SOL (≈ $${usdBalance.toFixed(2)} USD)
    
🛠 <a href="https://lynx-trading.gitbook.io/lynx-trading" target="_blank" ><b>Lynx Docs</b></a>
✖️ <a href="https://x.com/lynxonsolana" target="_blank"><b>Lynx X</b></a>
🤝 <a href="https://t.me/lynxbotportal"><b>Lynx Portal</b></a>
    
💡 <b>Send a token address to get started.</b>
      `
    const content = [
      [{ text: '🟢 Buy', callback_data: 'buy-token' }, { text: '🔴 Sell', callback_data: 'sell-token' }],
      [{ text: '🎯 Sniper', callback_data: 'sniping' }, { text: '📋 Copy Trade', callback_data: 'copytrade' }, { text: '💤 AFK Mode', callback_data: 'limitOrders' }],
      [{ text: '💳 Manage Wallets', callback_data: 'manage-wallet' }, { text: '⏳ Limit Orders', callback_data: 'limitOrders' }],
      [{ text: '👥 Referrals', callback_data: 'referral' }, { text: '⚙️ Settings', callback_data: 'settings' }],
      [{ text: '⁉️ FAQ', callback_data: 'manage-wallet' }, { text: '🔄 Refresh', callback_data: '/start' }],
    ]

    return { title, content }
  }
}

export const lpDashboard = async (chatId: number, username: string) => {
  try {
    let userInfo = await helper.findUser(chatId, username);
    let sniperToken = await helper.findOne(chatId);
    let snipingTokensString: string[] = [];

    if (!userInfo) {
      console.log(`${username} : ${chatId} => Failed to fetch user info`);
      await helper.saveInfo(chatId, {
        ...initialUserInfo, userId: chatId, username,
        buyToken: [],
        allWallets: [],
        sellToken: []
      });
      userInfo = await helper.findUser(chatId, username);
    }

    if (sniperToken?.snipingTokens && sniperToken.snipingTokens.length !== 0) {
      for (const token of sniperToken.snipingTokens) {
        snipingTokensString.push(`💳 <code>${token.name}</code> • (<code>${token.ticker}</code>)\n`);
      }
    }

    const wallet = userInfo!.publicKey;
    console.log(`${username} : ${chatId} => LP Dashboard page`);
    console.log("snipingTokensString  ===>", snipingTokensString);

    // Get the current date and time formatted
    const nowUtc = new Date();
    const formattedTime = new Intl.DateTimeFormat("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(nowUtc);

    const title = `🎯 LP Sniper

Pending tasks:

${snipingTokensString.length > 0 ? snipingTokensString.join("\n") : "❌ No tokens to snipe. Please add new ones."}

🛠 <a href="">Lynx Docs</a>

💡 Looking for something new to do? Click the 🎯 Create Task button to create a new task.
`;

    // ✅ Generate buttons correctly
    const statusButtons = [];
    if (sniperToken?.snipingTokens?.length) {
      for (let i = 0; i < sniperToken.snipingTokens.length; i += 2) {
        if (sniperToken.snipingTokens[i + 1]) {
          // Pair two buttons per row
          statusButtons.push([
            { text: `🔴 ${sniperToken.snipingTokens[i].name}`, callback_data: `sniping-status-${i}` },
            { text: `🔴 ${sniperToken.snipingTokens[i + 1].name}`, callback_data: `sniping-status-${i + 1}` }
          ]);
        } else {
          // If only one button remains, add it alone
          statusButtons.push([{ text: `🔴 ${sniperToken.snipingTokens[i].name}`, callback_data: `sniping-status-${i}` }]);
        }
      }
    }

    const content = [
      ...statusButtons, // Add dynamically generated status buttons
      [{ text: "🎯 Create Task", callback_data: "set-sniping-token" }, { text: "🎯 Wallets", callback_data: "sniper-wallets" }],
      [{ text: "⏹ Pause All", callback_data: "sniping-start-stop" }, { text: "▶ Start All", callback_data: "sniping-start-stop" }, { text: "🗑 Delete All", callback_data: "delete-all-sniper-token" }],
      [{ text: "🔙 Back", callback_data: "back-to-main" }, { text: "🔁 Refresh", callback_data: "sniping" }],
      [{ text: "🗑 Close", callback_data: "back-to-main" }],
    ];

    return { title, content };
  } catch (error: any) {
    console.error("❌ Error fetching LP Dashboard:", error.message);
    return { title: "❌ Failed to fetch LP Sniping details.", content: [] };
  }
};

export const settingsPage = async (chatId: number, username: string) => {
  try {
    let userInfo = await helper.findUser(chatId, username);
    if (!userInfo) {
      console.log(`${username} : ${chatId} => Failed to fetch user info`);
      await helper.saveInfo(chatId, {
        ...initialUserInfo, userId: chatId, username,
        buyToken: [],
        allWallets: [],
        sellToken: []
      });
      userInfo = await helper.findUser(chatId, username);
    }

    const title = `🐾  <b>Lynx Settings!</b>

💡 Please enter all settings values accurately.


🛠 <a href="https://lynx-trading.gitbook.io/lynx-trading/lynx-user-guide/settings">Lynx Docs</a>

💡 Please check the documentation and proceed with the correct settings.
`;
    const content = [
      [{ text: '💳 Wallets', callback_data: 'wallets-setting' }, { text: "⛽ Fees", callback_data: "fees-setting" }],
      [{ text: "🟢 Buy Settings", callback_data: "buy-setting" }, { text: "🔴 Sell Settings", callback_data: "sell-setting" }],
      [{ text: "🥪 MEV Protection", callback_data: "mev-setting" }, { text: "💰 PNL Settings", callback_data: "pnl-setting" }],
      [{ text: "🔙 Back", callback_data: "back-to-main" }],
    ];

    return { title, content };

  } catch (err: any) {
    console.error("❌ Error fetching Setting:", err.message);
    return { title: "❌ Failed to fetch Setting details.", content: [] };
  }
}

export const feeSettingPage = async (chatId: number, username: string) => {
  try {
    let userInfo = await helper.findUser(chatId, username);
    if (!userInfo) {
      console.log(`${username} : ${chatId} => Failed to fetch user info`);
      await helper.saveInfo(chatId, {
        ...initialUserInfo, userId: chatId, username,
        buyToken: [],
        allWallets: [],
        sellToken: []
      });
      userInfo = await helper.findUser(chatId, username);
    }

    const title = `🐾  <b>Lynx Fees Settings!</b>

💡 Please enter all settings values accurately.

🛠 <a href="https://lynx-trading.gitbook.io/lynx-trading/lynx-user-guide/settings/fees">Lynx Docs</a>

💡 Please check the documentation and proceed with the correct settings.
`;
    const content = [
      [{ text: "💰 Buy Fee", callback_data: "fees-setting" }, { text: "💰 Sell Fee", callback_data: "sniper-wallets" }],
      [{ text: "💰 Buy Tip", callback_data: "sniping-start-stop" }, { text: "💰 Sell Tip", callback_data: "sniping-start-stop" }],
      [{ text: "🟢 Auto Tip", callback_data: "back-to-main" }],
      [{ text: "🔙 Back", callback_data: "settings" }, { text: "🗑 Close", callback_data: "back-to-main" }],
    ];

    return { title, content };

  } catch (err: any) {
    console.error("❌ Error fetching fees Setting:", err.message);
    return { title: "❌ Failed to fetch fees Setting details.", content: [] };
  }
}

export const buySettingPage = async (chatId: number, username: string) => {
  try {
    let userInfo = await helper.findUser(chatId, username);
    if (!userInfo) {
      console.log(`${username} : ${chatId} => Failed to fetch user info`);
      await helper.saveInfo(chatId, {
        ...initialUserInfo, userId: chatId, username,
        buyToken: [],
        allWallets: [],
        sellToken: []
      });
      userInfo = await helper.findUser(chatId, username);
    }

    const title = `🐾  <b>Lynx Buy Settings!</b>

💡 Please enter all settings values accurately.

🛠 <a href="https://lynx-trading.gitbook.io/lynx-trading/lynx-user-guide/settings/buy-settings">Lynx Docs</a>

💡 Please check the documentation and proceed with the correct settings.
`;
    const content = [
      [{ text: "💰 0.5 SOL ", callback_data: "fees-setting" }, { text: "💰 1 SOL ", callback_data: "sniper-wallets" }],
      [{ text: "💰 3 SOL ", callback_data: "sniper-wallets" }, { text: "💰 X SOL ", callback_data: "sniping-start-stop" }],
      [{ text: "🔙 Back", callback_data: "settings" }, { text: "🗑 Close", callback_data: "back-to-main" }],
    ];

    return { title, content };
  } catch (err: any) {
    console.error("❌ Error fetching buy Setting:", err.message);
    return { title: "❌ Failed to fetch buy Setting details.", content: [] };
  }
}

export const sellSettingPage = async (chatId: number, username: string) => {
  try {
    let userInfo = await helper.findUser(chatId, username);
    if (!userInfo) {
      console.log(`${username} : ${chatId} => Failed to fetch user info`);
      await helper.saveInfo(chatId, {
        ...initialUserInfo, userId: chatId, username,
        buyToken: [],
        allWallets: [],
        sellToken: []
      });
      userInfo = await helper.findUser(chatId, username);
    }

    const title = `🐾  <b>Lynx SELL Settings!</b>

💡 Please enter all settings values accurately.

🛠 <a href="https://lynx-trading.gitbook.io/lynx-trading/lynx-user-guide/settings/buy-settings">Lynx Docs</a>

💡 Please check the documentation and proceed with the correct settings.
`;
    const content = [
      [{ text: "💰 10% ", callback_data: "fees-setting" }, { text: "💰 25% ", callback_data: "sniper-wallets" }],
      [{ text: "💰 100% ", callback_data: "sniper-wallets" }, { text: "💰 X SOL or X %", callback_data: "sniping-start-stop" }],
      [{ text: "🔙 Back", callback_data: "settings" }, { text: "🗑 Close", callback_data: "back-to-main" }],
    ];

    return { title, content };
  } catch (err: any) {
    console.error("❌ Error fetching sell Setting:", err.message);
    return { title: "❌ Failed to fetch sell Setting details.", content: [] };
  }
}

export const mevSettingPage = async (chatId: number, username: string) => {
  try {
    let userInfo = await helper.findUser(chatId, username);
    if (!userInfo) {
      console.log(`${username} : ${chatId} => Failed to fetch user info`);
      await helper.saveInfo(chatId, {
        ...initialUserInfo, userId: chatId, username,
        buyToken: [],
        allWallets: [],
        sellToken: []
      });
      userInfo = await helper.findUser(chatId, username);
    }

    const title = `🐾  <b>Lynx MEV Settings!</b>

💡 Please enter all settings values accurately.

🛠 <a href="https://lynx-trading.gitbook.io/lynx-trading/lynx-user-guide/settings/mev-protection">Lynx Docs</a>

💡 Please check the documentation and proceed with the correct settings.
`;
    const content = [
      [{ text: "🟢 MEV Protect (Buys) ", callback_data: "fees-setting" }, { text: "🔴 MEV Protect (Sells) ", callback_data: "sniper-wallets" }],
      [{ text: "🔙 Back", callback_data: "settings" }, { text: "🗑 Close", callback_data: "back-to-main" }],
    ];

    return { title, content };
  } catch (err: any) {
    console.error("❌ Error fetching MEV Setting:", err.message);
    return { title: "❌ Failed to fetch MEV Setting details.", content: [] };
  }
}

export const pnlSettingPage = async (chatId: number, username: string) => {
  try {
    let userInfo = await helper.findUser(chatId, username);
    if (!userInfo) {
      console.log(`${username} : ${chatId} => Failed to fetch user info`);
      await helper.saveInfo(chatId, {
        ...initialUserInfo, userId: chatId, username,
        buyToken: [],
        allWallets: [],
        sellToken: []
      });
      userInfo = await helper.findUser(chatId, username);
    }

    const title = `🐾  <b>Lynx PNL Settings!</b>

💡 Please enter all settings values accurately.

🛠 <a href="https://lynx-trading.gitbook.io/lynx-trading/lynx-user-guide/settings/pnl-settings">Lynx Docs</a>

💡 Please check the documentation and proceed with the correct settings.
`;
    const content = [
      [{ text: "🟢 Ticker ", callback_data: "fees-setting" }, { text: "🔴 PNL ", callback_data: "sniper-wallets" }],
      [{ text: "🔙 Back", callback_data: "settings" }, { text: "🗑 Close", callback_data: "back-to-main" }],
    ];

    return { title, content };
  } catch (err: any) {
    console.error("❌ Error fetching PNL Setting:", err.message);
    return { title: "❌ Failed to fetch PNL Setting details.", content: [] };
  }
}

export const walletSettingPage = async (chatId: number, username: string) => {
  try {
    // 🔹 Fetch user info from the database
    let userInfo = await helper.findUser(chatId, username);
    let allWallet = await helper.findOne(chatId);
    let mainWallet = await helper.findOne(chatId);
    let allWalletsString: string[] = [];
    let mainWalletData = "";

    if (!userInfo) {
      console.log(`${username} : ${chatId} => Failed to fetch the user info from DB`);
      userInfo = await helper.findUser(chatId, username); // Refetch userInfo after saving
    }

    // 🔹 Format Main Wallet if available
    if (mainWallet?.publicKey) {
      const formattedMainWallet = `${mainWallet.publicKey.slice(0, 5)}...${mainWallet.publicKey.slice(-5)}`;
      mainWalletData = `<code>${mainWallet.publicKey}</code>\n`;

      try {
        const solBalance = await connection.getBalance(new PublicKey(mainWallet.publicKey));
        const balanceInSol = solBalance / 1e9; // Convert lamports to SOL
        mainWalletData += `💰 ${balanceInSol.toFixed(2)} SOL\n`;
      } catch (error) {
        console.log("Error fetching SOL balance:", error);
      }
    }

    // 🔹 Check if snipingWallets exist
    if (allWallet?.allWallets && allWallet.allWallets.length > 0) {
      for (let wallet of allWallet.allWallets) {
        const publicKey = new PublicKey(wallet.pubkey);
        const balance = await connection.getBalance(publicKey);
        const balanceInSol = balance / 1_000_000_000;

        allWalletsString.push(`💳 <code>${wallet.pubkey}</code>\n💰 ${balanceInSol.toFixed(2)} SOL\n`);
      }
    } else {
      allWalletsString.push("❌ You currently have no wallets available. Please add a new one.");
    }

    console.log(`${username} : ${chatId} =>  all wallets page`);
    console.log("allWalletsString  ===>", allWalletsString);

    // 🔹 Format the current date and time for the last update
    const nowUtc = new Date();
    const formattedTime = new Intl.DateTimeFormat("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(nowUtc);

    const title = `🎯 Wallets you can use 👝

List of Current Wallets:

💳 ${mainWalletData}

${allWalletsString.join("\n")}

📖 <a href="https://yourwebsite.com/learn-more">Learn More!</a>

⏱ Last updated : ${formattedTime}
`;

    // 🔹 Generate Buttons
    const statusMainButtons = [];

    // 🟢 Main Wallet Button (Always One Per Line)
    if (mainWallet?.publicKey) {
      const formattedMainWallet = `${mainWallet.publicKey.slice(0, 5)}...${mainWallet.publicKey.slice(-5)}`;
      statusMainButtons.push([{ text: `✅ ${formattedMainWallet}`, callback_data: "main-wallet-status" }]);
    }

    const statusButtons = [];
    // 🔴 Sniping Wallet Buttons (2 Per Row)
    if (allWallet?.allWallets?.length) {
      for (let i = 0; i < allWallet.allWallets.length; i++) {
        const formattedToken1 = `${allWallet.allWallets[i].pubkey.slice(0, 5)}...${allWallet.allWallets[i].pubkey.slice(-5)}`;

        console.log("allWallet.allWallets[i].pubkey   ===> ", allWallet.allWallets[i].pubkey)

        // If only one button remains, add it alone
        statusButtons.push([{ text: `${formattedToken1}`, callback_data: `sniping-status-${i}` }, { text: `🗑 Delete`, callback_data: `delete-wallet-confirm-${i}` }]);
      }
    }

    const content = [
      ...statusMainButtons,
      [{ text: "📥 Import Wallet", callback_data: "import-another-wallet-confirm" }, { text: '🆕 Create New Wallet', callback_data: 'create-another-new-wallet-confirm' }],
      ...statusButtons,
      [{ text: "🔙 Back", callback_data: "back-to-main" }]
    ];

    return { title, content };
  } catch (error: any) {
    console.error("❌ Error fetching sniping wallet list:", error.message);
    return { title: "❌ Failed to fetch sniping wallets.", content: [] };
  }
}

export const snipingWalletList = async (chatId: number, username: string) => {
  try {
    // 🔹 Fetch user info from the database
    let userInfo = await helper.findUser(chatId, username);
    let sniperWallet = await helper.findOne(chatId);
    let mainWallet = await helper.findOne(chatId);
    let snipingWalletsString: string[] = [];
    let mainWalletData = "";

    if (!userInfo) {
      console.log(`${username} : ${chatId} => Failed to fetch the user info from DB`);
      userInfo = await helper.findUser(chatId, username); // Refetch userInfo after saving
    }

    // 🔹 Format Main Wallet if available
    if (mainWallet?.publicKey) {
      const formattedMainWallet = `${mainWallet.publicKey.slice(0, 5)}...${mainWallet.publicKey.slice(-5)}`;
      mainWalletData = `💳 <code>${mainWallet.publicKey}</code>\n`;

      try {
        const solBalance = await connection.getBalance(new PublicKey(mainWallet.publicKey));
        const balanceInSol = solBalance / 1e9; // Convert lamports to SOL
        mainWalletData += `💰 ${balanceInSol.toFixed(2)} SOL\n`;
      } catch (error) {
        console.log("Error fetching SOL balance:", error);
      }
    }

    // 🔹 Check if snipingWallets exist
    if (sniperWallet?.snipingWallets && sniperWallet.snipingWallets.length > 0) {
      for (let wallet of sniperWallet.snipingWallets) {
        const publicKey = new PublicKey(wallet.pubkey);
        const balance = await connection.getBalance(publicKey);
        const balanceInSol = balance / 1_000_000_000;

        snipingWalletsString.push(`💳 <code>${wallet.pubkey}</code>\n💰 ${balanceInSol.toFixed(2)} SOL\n`);
      }
    } else {
      snipingWalletsString.push("❌ You currently have no wallets available. Please add a new one.");
    }

    console.log(`${username} : ${chatId} =>  LP Dashboard page`);
    console.log("snipingWalletsString  ===>", snipingWalletsString);

    // 🔹 Format the current date and time for the last update
    const nowUtc = new Date();
    const formattedTime = new Intl.DateTimeFormat("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(nowUtc);

    const title = `🎯 Wallets you can use 👝

List of Current Wallets:

💳 ${mainWalletData}

${snipingWalletsString.join("\n")}

📖 <a href="https://yourwebsite.com/learn-more">Learn More!</a>

⏱ Last updated : ${formattedTime}
`;

    // 🔹 Generate Buttons
    const statusButtons = [];

    // 🟢 Main Wallet Button (Always One Per Line)
    if (mainWallet?.publicKey) {
      const formattedMainWallet = `${mainWallet.publicKey.slice(0, 5)}...${mainWallet.publicKey.slice(-5)}`;
      statusButtons.push([{ text: `🟢 ${formattedMainWallet}`, callback_data: "main-wallet-status" }]);
    }

    // 🔴 Sniping Wallet Buttons (2 Per Row)
    if (sniperWallet?.snipingWallets?.length) {
      for (let i = 0; i < sniperWallet.snipingWallets.length; i += 2) {
        const formattedToken1 = `${sniperWallet.snipingWallets[i].pubkey.slice(0, 5)}...${sniperWallet.snipingWallets[i].pubkey.slice(-5)}`;

        if (sniperWallet.snipingWallets[i + 1]) {
          const formattedToken2 = `${sniperWallet.snipingWallets[i + 1].pubkey.slice(0, 5)}...${sniperWallet.snipingWallets[i + 1].pubkey.slice(-5)}`;
          // Pair two buttons in one row
          statusButtons.push([
            { text: `🔴 ${formattedToken1}`, callback_data: `sniping-status-${i}` },
            { text: `🔴 ${formattedToken2}`, callback_data: `sniping-status-${i + 1}` }
          ]);
        } else {
          // If only one button remains, add it alone
          statusButtons.push([{ text: `🔴 ${formattedToken1}`, callback_data: `sniping-status-${i}` }]);
        }
      }
    }

    const content = [
      ...statusButtons,
      [{ text: "📥 Import Wallet", callback_data: "add-sniper-wallet" }, { text: '🆕 Create New Wallet', callback_data: 'create-new-wallet-confirm' }],
      [{ text: "🔙 Back", callback_data: "sniping" }]
    ];

    return { title, content };
  } catch (error: any) {
    console.error("❌ Error fetching sniping wallet list:", error.message);
    return { title: "❌ Failed to fetch sniping wallets.", content: [] };
  }
};

export const importSnipingWalletConfirm = async (chatId: number) => {
  const title = `⚠️ Warning: Importing a New Wallet ⚠️

🛑 By importing a new secret key, your current wallet will be erased. 

🤔 Are you sure you want to proceed?`;

  const content = [
    [
      { text: '✅ Yes, Import New Wallet', callback_data: 'import-wallet' },
      { text: '❌ No, Go Back', callback_data: 'manage-wallet' }
    ]
  ];

  return { title, content };
};

export const addSnipingToken = async (chatId: number, username: string, tokenStr: string) => {
  let title: string;
  try {
    console.log(`${username} : ${chatId} => In token setting for sniping page`);

    // 🔹 Validate token address
    let mintAddress: PublicKey;
    try {
      mintAddress = new PublicKey(tokenStr);
      console.log("mintAddress  ===>", mintAddress)
    } catch (error: any) {
      console.error("❌ Invalid token address format:", error.message);
      throw new Error("Invalid token address.");
    }

    // 🔹 Fetch token metadata (for SPL tokens, not NFTs)
    let tokenMetadata;
    try {
      tokenMetadata = await metaplex.nfts().findByMint({ mintAddress });
    } catch (error) {
      console.warn("⚠️ Token not found on Solana. It may be incorrect or not deployed.");
      throw new Error("Invalid SPL token address.");
    }
    const { name, ticker } = await getTokenMetadata(tokenStr);
    // 🔹 Store token in database (if valid)
    const result = await helper.addSnipingToken(chatId, tokenStr);

    // 🔹 Format time
    const nowUtc = new Date();
    const formattedTime = new Intl.DateTimeFormat("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(nowUtc);

    if (result === false) {
      title = `🎯 LP Sniping Task 🚀

🌐 ${tokenMetadata.name} • ${tokenMetadata.symbol} :
<code>${tokenStr}</code>

💎 Based Alert: Less than 10 gigachads found this. Elite snipers only. 💎

⏱ Last updated: ${formattedTime}`;
    } else if (result) {
      title = `🎯 LP Sniping Task 🚀

🌐 <code>${tokenMetadata.name}</code> • <code>${tokenMetadata.symbol}</code> :

🟢 <code>${tokenStr}</code>

⏱ Last updated: ${formattedTime}`;
    } else {
      title = "Adding sniping token failed";
    }
  } catch (error: any) {
    console.error(`${username} : ${chatId} => Error: ${error.message}`);
    title = "❌ Incorrect token address to snipe";
  }

  // 🔹 Initial button UI state
  const content = [
    [{ text: "🎯 Task Wallet", callback_data: "set-sniping-token" }],
    [
      { text: "🟢 Normal Mode", callback_data: "toggle-sniping-mode" },
      // { text: "🔴 Pro Mode", callback_data: "toggle-sniping-mode" }
      { text: "🔁 Switch to Sell", callback_data: "sniping" }
    ],
    // [{ text: "🔁 Switch to Sell", callback_data: "sniping" }, { text: "💰 Buy Amount: 0 SOL", callback_data: "copytrade" }],
    [{ text: "💰 Fee: 0 SOL", callback_data: "sniping" }, { text: "Min Amount Out: N/A", callback_data: "copytrade" }],
    [{ text: "💰 Buy Amount: 0 SOL", callback_data: "copytrade" }, { text: "💰 Buy Tip: N/A SOL", callback_data: "copytrade" }],
    [{ text: "Active 🔴", callback_data: "sniping" }, { text: "🗑 Delete Task", callback_data: "delete-sniper-token" }],
    [{ text: "🔙 Back", callback_data: "sniping" }, { text: "🔁 Refresh", callback_data: "refresh-sniper-token" }],
    [{ text: "🗑 Close", callback_data: "back-to-main" }],
  ];
  return { title, content };
};

export const buyToken = async (chatId: number, username: string, tokenStr: string) => {
  console.log("buy token address", tokenStr);
  let title: string;
  let mainWallet = await helper.findOne(chatId);
  let name = "Unknown Token";
  let ticker = "???";
  let price = 0;
  let liquidity = 0;
  let marketCap = 0;
  let bondingCurveProgress = 0;
  let isRenounced = "❌";
  let isFreeze = "❌";
  let platform = "Unknown";
  let mainWalletData = "";
  let balance = 0;
  let amount = 0;
  let buyTip = 0;
  let autoTip = false;
  let mevProtect = false;

  try {
    // 🔹 Validate token address
    let mintAddress: PublicKey;
    try {
      mintAddress = new PublicKey(tokenStr);
      console.log("mintAddress ===>", mintAddress);
    } catch (error: any) {
      console.error("❌ Invalid token address format:", error.message);
      throw new Error("Invalid token address.");
    }

    // 🔹 Fetch Wallet balance
    if (mainWallet?.publicKey) {
      mainWalletData = `<code>${mainWallet.publicKey}</code>`;
      try {
        const solBalance = await connection.getBalance(new PublicKey(mainWallet.publicKey));
        balance = solBalance / 1e9; // Convert lamports to SOL
      } catch (error) {
        console.log("Error fetching SOL balance:", error);
      }
    }

    // 🔹 Fetch Token Metadata (Jupiter or Birdeye)
    try {
      const tokenMetadata = await fetch(`https://tokens.jup.ag/token/${tokenStr}`);
      const tokenMetadataJson = await tokenMetadata.json();

      if (tokenMetadataJson.name) name = tokenMetadataJson.name;
      if (tokenMetadataJson.symbol) ticker = tokenMetadataJson.symbol;
      if (tokenMetadataJson.freeze_authority === null) isFreeze = "✅";
      if (tokenMetadataJson.mint_authority === null) isRenounced = "✅";
    } catch (err) {
      console.warn("⚠️ Failed to fetch token metadata.");
    }

    // 🔹 Fetch Token Price (Jupiter)
    try {
      const tokenPriceResponse = await fetch(`https://api.jup.ag/price/v2?ids=${tokenStr}`);
      const tokenPriceJson = await tokenPriceResponse.json();
      if (tokenPriceJson.data && tokenPriceJson.data[tokenStr]?.price) {
        price = tokenPriceJson.data[tokenStr].price;
        if (isNaN(price)) price = 0; // Ensure price is a valid number
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch token price.");
    }

    // 🔹 Fetch Token Liquidity and MarketCap (Optional)
    // These can be set to defaults or fetched from an additional API if needed
    liquidity = isNaN(liquidity) ? 0 : liquidity;
    marketCap = isNaN(marketCap) ? 0 : marketCap;

    // 🔹 Check if Token is from Pump.fun
    try {
      const pumpResponse = await fetch(`https://pump.fun/api/token/${tokenStr}`);
      const pumpData = await pumpResponse.json();
      if (pumpData.success && pumpData.data?.bondingCurveProgress !== undefined) {
        platform = "Pump.fun";
        bondingCurveProgress = pumpData.data.bondingCurveProgress;
      }
    } catch (error) {
      console.warn("⚠️ Token is not from Pump.fun.");
    }

    if (!mainWallet || mainWallet?.buyToken === undefined || mainWallet?.buyToken === null || mainWallet?.buyToken.length === 0 || mainWallet?.buyToken[0].address !== tokenStr) {
      // Create BuyToken data
      const newTokenData = {
        address: tokenStr,
        name,
        ticker,
        price: price, // Ensure price is a valid number with precision
        liq: liquidity, // Ensure liquidity is a valid number with precision
        mc: marketCap, // Ensure market cap is a valid number with precision
        bondingCurveProgress: bondingCurveProgress,
        renounced: isRenounced === "✅", // Convert to boolean
        freeze: isFreeze === "✅", // Convert to boolean
        amount: amount,
        autoTip: autoTip,
        buyTip: buyTip,
        mevProtect: mevProtect,
        wallets: [
          {
            address: mainWallet?.publicKey,
          },
        ],
      };

      // 🔹 Update the User model with the new token data
      await UserModel.findOneAndUpdate(
        { userId: chatId },
        { buyToken: newTokenData }, // Use the correct data object here
        { new: true } // Return the updated document
      );
    } else {
      amount = mainWallet?.buyToken[0].amount;
      autoTip = mainWallet?.buyToken[0].autoTip;
      buyTip = mainWallet?.buyToken[0].buyTip;
      mevProtect = mainWallet?.buyToken[0].mevProtect;

    }

    title = `⚡️ <b>Lynx Buy</b>

  <b>Buy $${ticker}</b> — (${name}) 🪙
  <code>${mintAddress.toBase58()}</code>
  💲<a href="https://t.me/dontg_trading_bot?=r-${username}-${mintAddress.toBase58()}" target="_blank">Share using your Referral Link</a>

  <b>Price:</b> $${price} — <b>LIQ:</b> ${liquidity} — <b>MC:</b> ${marketCap}
  <b>Renounced:</b> ${isRenounced}
  <b>Freeze:</b> ${isFreeze}

  ${platform === "Pump.fun" ? `💊 Bonding Curve Progress: ${bondingCurveProgress}` : ""}

  💰 Amount to buy: ${amount}
  💰 Buy Tip: ${buyTip}

  💳 ${mainWalletData}
  💰 ${balance} SOL
  `;

  } catch (error: any) {
    console.error(`${username} : ${chatId} => Error: ${error.message}`);
    title = "❌ Please enter a valid token address.";
  }

  // 🔹 Initial button UI state
  const content = [
    [{ text: "🔙 Back", callback_data: "back-to-main" }, { text: "🔄 Refresh", callback_data: "buy-token-refresh" }],
    [{ text: "💼 Wallet", callback_data: "wallet-to-buy" }, { text: "⚙️ Settings", callback_data: "buy-setting" }],
    [{ text: `${amount === 0.5 ? "✅ 0.5 SOL 💰" : "💰 0.5 SOL"}`, callback_data: "buy-token-amount-0.5" }, { text: `${amount === 1 ? "✅ 1 SOL 💰" : "💰 1 SOL"}`, callback_data: "buy-token-amount-1" }],
    [{ text: `${amount === 3 ? "✅ 3 SOL 💰" : "💰 3 SOL"}`, callback_data: "buy-token-amount-3" }, { text: `${(amount !== 0.5 && amount !== 1 && amount !== 3) ? "✅ Custom 💰" : "💰 Custom"}`, callback_data: "buy-token-amount-x" }],
    [{ text: "💰 Buy Tip", callback_data: `buy-token-state-tip` }, { text: "📚 Limit Orders", callback_data: `Limit Orders` }, { text: "⚠️ Slippage", callback_data: `Slippage` }],
    [{ text: `${autoTip ? "🟢 Auto Tip" : "🔴 Auto Tip"}`, callback_data: `buy-token-state-auto` }, { text: `${mevProtect ? "🟢 MEV Protect" : "🔴 MEV Protect"}`, callback_data: `buy-token-state-mev` }],
    [{ text: "✅ Buy", callback_data: "confirm-buy-token" }],
  ];

  return { title, content };
};


export const sellToken = async (
  chatId: number,
  username: string
): Promise<{ title: string; content: { text: string; callback_data: string }[][] }> => {
  console.log(`${username} : ${chatId} => Entered token sell page`);

  let userInfo = await helper.findUser(chatId);
  let mainWallet = await helper.findOne(chatId);

  if (!userInfo) {
    return {
      title: "Error",
      content: [[{ text: "❌ User not found.", callback_data: "error" }]],
    };
  }

  if (!mainWallet) {
    console.log(`${username} : ${chatId} => No main wallet found.`);
    return {
      title: "Error",
      content: [[{ text: " Select your default manager wallet.", callback_data: "manage-wallet" }]],
    };
  }

  const wallets = [
    mainWallet.publicKey,
    ...(mainWallet.snipingWallets?.map((w) => w.pubkey) || []),
  ].filter(Boolean); // Remove null/undefined

  for (const wallet of wallets) {
    console.log(`Fetching tokens for wallet => ${wallet}`);

    try {
      const publicKey = new PublicKey(wallet);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      });

      for (const account of tokenAccounts.value) {
        const { mint, tokenAmount } = account.account.data.parsed.info;
        const balance = tokenAmount.uiAmount;
        if (!balance || balance === 0) continue;

        const metadata = await getTokenMetadata(mint);
        if (!metadata?.name || !metadata?.ticker) continue;

        // 🔹 Construct token data object
        const tokenData = {
          address: mint,
          name: metadata.name,
          ticker: metadata.ticker,
          amount: balance,
          pubkey: wallet,
          sellAmount: 0,
          sellState: "Swap"
        };
        console.log("tokenData ===>", tokenData)

        // 🔹 Save token data using helper function
        await helper.saveTokenData(chatId, tokenData);
      }

      console.log(`✅ Tokens updated for user ${chatId}`);
    } catch (error) {
      console.error(`❌ Error fetching tokens for wallet ${wallet}:`, error);
    }
  }

  let _userInfo = await helper.findUser(chatId);

  if (!_userInfo) {
    return {
      title: "Error",
      content: [[{ text: "❌ User not found.", callback_data: "error" }]],
    };
  }

  // 🔹 Ensure allTokens has the correct structure
  const allTokens: { name: string; balance: number; price: number; mint: string }[] = _userInfo.sellToken.map(
    (token) => ({
      name: token.name,
      balance: token.tokenAmount,
      price: token.price || 0, // Assuming 'price' might not be defined, default to 0
      mint: token.address,
    })
  );


  let title = `⚡️ <b>Lynx Sell</b>\n\n<b>Select a token to sell</b>\n 💳 <code>${mainWallet?.publicKey}</code> \n\n`;

  title += `<b>Your Tokens:</b>\n`;

  const tokensToDisplay = allTokens;

  tokensToDisplay.forEach((token) => {
    title += `🔹 <b>${token.name}</b>\n 💰 Balance: ${token.balance.toFixed(2)}\n 💲 Price: $${(
      token.price * token.balance
    ).toFixed(2)}\n\n`;
  });

  if (tokensToDisplay.length === 0) {
    title += `\n<b>❌ You have no tokens to sell. </b>\n`;
  }

  const content: { text: string; callback_data: string }[][] = [];

  for (let i = 0; i < tokensToDisplay.length; i += 3) {
    const row = [];
    for (let j = 0; j < 3 && i + j < tokensToDisplay.length; j++) {
      const token = tokensToDisplay[i + j];
      row.push({
        text: `${token.name}`,
        callback_data:
          allTokens.length > 0 ? `confirm-sell-token-${token.mint}` : `confirm-sell-token-${token.mint}`,
      });
    }
    content.push(row);
  }

  content.push([
    { text: "🔙 Back", callback_data: "back-to-main" },
    { text: "🔄 Refresh", callback_data: "sell-token" },
  ]);

  return { title, content };
};

export const selectedSellToken = async (chatId: number, username: string, tokenId: string) => {
  let amount = 0;
  let autoTip = false;
  let mevProtect = false;
  let sellTip = 0;

  if (!tokenId) {
    console.error("❌ tokenId is empty or undefined");
    return {
      title: "Error",
      content: [[{ text: "❌ Invalid token ID.", callback_data: "sell-token" }]],
    };
  }

  try {
    console.log(`${username} : ${chatId} => Selected token ID: ${tokenId}`);

    // Fetch user data
    let userInfo = await UserModel.findOne({ userId: chatId });

    if (!userInfo) {
      console.log(`${username} : ${chatId} => User not found`);
      return {
        title: "Error",
        content: [[{ text: "❌ Failed to retrieve user data.", callback_data: "error" }]],
      };
    }

    // Fetch the token from user's sellToken array
    const selectedToken = userInfo.sellToken.find((token) => token.address === tokenId);

    console.log("selectedToken data ==>", selectedToken)

    if (!selectedToken) {
      console.log(`${username} : ${chatId} => Token not found`);
      return {
        title: "Error",
        content: [[{ text: "❌ Selected token not found.", callback_data: "sell-token" }]],
      };
    }

    if (
      userInfo.selectedSellToken === undefined ||
      userInfo.selectedSellToken === null ||
      userInfo.selectedSellToken.length === 0 ||
      userInfo.selectedSellToken[0].address !== tokenId
    ) {
      userInfo.selectedSellToken[0].set({
        address: selectedToken?.address,
        name: selectedToken?.name,
        ticker: selectedToken?.ticker,
        tokenAmount: selectedToken?.tokenAmount,
        pubkey: selectedToken?.pubkey,
        price: selectedToken?.price,
        amount: selectedToken?.amount,
        autoTip: selectedToken?.autoTip,
        mevProtect: selectedToken?.mevProtect,
        sellTip: selectedToken?.sellTip
      });
      console.log(`Updated token data for ${selectedToken.name} in selectedSellToken[0].`);
    } else {
      console.log(`Using existing data from selectedSellToken[0] for ${selectedToken.name}.`);
    }

    // 🔴 If the address matches, no need to update, just use existing data
    amount = userInfo.selectedSellToken[0].amount;
    autoTip = userInfo.selectedSellToken[0].autoTip;
    mevProtect = userInfo.selectedSellToken[0].mevProtect;
    sellTip = userInfo.selectedSellToken[0].sellTip;

    // Prepare UI response
    let title = `<b>Sell $${selectedToken.name} - (${selectedToken.ticker})</b>
    
  🔹<b>${selectedToken.address}</b>
  <a href="https://dexscreener.com/solana/${selectedToken.address}">Share token with your Reflink</a>
    
  💰 Balance: ${selectedToken.tokenAmount.toFixed(4)} ($${(selectedToken.tokenAmount * selectedToken.price).toFixed(2)}) - \n💳 ${selectedToken.pubkey}
  💰 Price: $${selectedToken.price}
    
  💲 Estimated Value: $${(selectedToken.price * selectedToken.tokenAmount).toFixed(2)}

  💰 Amount to Sell: ${amount}
  💰 Sell Tip: ${sellTip}
    
  You sell:
  <b>${selectedToken.name} (${selectedToken.price})</b> = 0.00 SOL (${selectedToken.price})
  Price impact: 20.33%
  `;

    const content = [
      [{ text: "🔙 Back", callback_data: `sell-token` }, { text: "🔁 Refresh", callback_data: `sell-token-refresh` }],
      [{ text: `${amount === 10 ? "✅ 10 % 💰" : "💰 10 %"}`, callback_data: `sell-token-amount-10` }, { text: `${amount === 25 ? "✅ 25 % 💰" : "💰 25 %"}`, callback_data: `sell-token-amount-25` }],
      [{ text: `${amount === 100 ? "✅ 100 % 💰" : "💰 100 %"}`, callback_data: "sell-token-amount-100" }, { text: `${(amount !== 10 && amount !== 25 && amount !== 100) ? "✅ X % 💰" : "💰 X %"}`, callback_data: `sell-token-amount-x` }],
      [{ text: "💰 Sell Tip", callback_data: `sell-token-state-tip` }, { text: "📚 Limit Orders", callback_data: "sell-Limit Orders" }, { text: "⚠️ Slippage", callback_data: `sell-Slippage` }],
      [{ text: `${autoTip ? "🟢 Auto Tip" : "🔴 Auto Tip"}`, callback_data: `sell-token-state-auto` }, { text: `${mevProtect ? "🟢 MEV Protect" : "🔴 MEV Protect"}`, callback_data: `sell-token-state-mev` }],
      [{ text: "✅ Sell", callback_data: `confirm-sell-token` }]
    ];

    // Save the updated selectedSellToken in the database using update
    await UserModel.updateOne(
      { userId: chatId },
      { $set: { selectedSellToken: userInfo.selectedSellToken } }
    );

    return { title, content };
  } catch (err) {
    console.error(`${username} : ${chatId} => Error in selectedSellToken:`, err);
    return {
      title: "Error",
      content: [[{ text: "❌ An error occurred. Try again.", callback_data: "sell-token" }]],
    };
  }
};

export const selectWallets = async (chatId: number, username: string) => {
  try {
    // 🔹 Fetch user info from the database
    let userInfo = await helper.findUser(chatId, username);
    let allWallet = await helper.findOne(chatId);
    let mainWallet = await helper.findOne(chatId);
    let sallWalletString: string[] = [];
    let mainWalletData = "";
    let balance = 0;

    if (!userInfo) {
      console.log(`${username} : ${chatId} => Failed to fetch the user info from DB`);
      userInfo = await helper.findUser(chatId, username); // Refetch userInfo after saving
    }

    if (mainWallet?.publicKey) {
      // 🔹 Format the Main Wallet Address (First 5 + Last 5 characters)
      const formattedMainWallet = `${mainWallet.publicKey.slice(0, 5)}...${mainWallet.publicKey.slice(-5)}`;
      mainWalletData = `<code>${mainWallet.publicKey}</code>`;

      try {
        const solBalance = await connection.getBalance(new PublicKey(mainWallet.publicKey));
        balance = solBalance / 1e9; // Convert lamports to SOL
      } catch (error) {
        console.log("Error fetching SOL balance:", error);
      }
    }

    // 🔹 Check if snipingWallets exists and is non-empty, else show a default message
    if (allWallet?.allWallets && allWallet.allWallets.length > 0) {
      for (let wallet of allWallet.allWallets) {
        try {
          const publicKey = new PublicKey(wallet.pubkey);
          const walletBalance = await connection.getBalance(publicKey);
          const balanceInSol = walletBalance / 1_000_000_000;

          sallWalletString.push(`💳 <code>${wallet.pubkey}</code>\n💰 ${balanceInSol.toFixed(2)} SOL\n`);
        } catch (error) {
          console.log(`Error fetching balance for sniping wallet ${wallet.pubkey}:`, error);
        }
      }
    } else {
      sallWalletString.push("❌ You currently have no wallets available. Please add a new one.");
    }

    console.log(`${username} : ${chatId} =>  LP Dashboard page`);
    console.log("sallWalletString  ===>", sallWalletString);

    // 🔹 Format the current date and time for the last update
    const nowUtc = new Date();
    const formattedTime = new Intl.DateTimeFormat("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(nowUtc);

    const title = `🎯 Wallets you can use 👝

List of Current Wallets:

💳 ${mainWalletData}
💰 ${balance} SOL

${sallWalletString.join("\n")}

📖 <a href="https://yourwebsite.com/learn-more">Learn More!</a>

⏱ Last updated : ${formattedTime}
`;

    // Generate status buttons dynamically based on the sniping wallets
    const statusButtons: any[] = [];

    // ✅ Add Main Wallet as the FIRST BUTTON (1 per row) with 🟢 icon
    if (mainWallet?.publicKey) {
      const formattedMainWallet = `${mainWallet.publicKey.slice(0, 5)}...${mainWallet.publicKey.slice(-5)}`;
      statusButtons.push([{ text: `🟢 ${formattedMainWallet}`, callback_data: `buy-token-wallet-${mainWallet?.publicKey}` }]);
    }

    // ✅ Add Sniping Wallets (2 per row, last one alone if odd)
    if (allWallet?.allWallets?.length) {
      for (let i = 0; i < allWallet.allWallets.length; i++) {
        const formattedToken1 = `${allWallet.allWallets[i].pubkey.slice(0, 5)}...${allWallet.allWallets[i].pubkey.slice(-5)}`;
        const callbackData = `buy-token-wallet-${allWallet.allWallets[i].pubkey}`;

        let statusButton: any[] = [];
        const walletInTokenAddress = userInfo?.buyToken?.some((token: any) =>
          token.wallets?.some((w: any) => w.address === allWallet.allWallets[i].pubkey)
        );

        // Check if the wallet is already in the tokenAddress
        if (walletInTokenAddress) {
          statusButton.push({ text: `🟢 ${formattedToken1}`, callback_data: callbackData });
        } else {
          statusButton.push({ text: `🔴 ${formattedToken1}`, callback_data: callbackData });
        }

        statusButtons.push(statusButton);

        // if (sniperWallet.snipingWallets[i + 1]) {
        //   const formattedToken2 = `${sniperWallet.snipingWallets[i + 1].pubkey.slice(0, 5)}...${sniperWallet.snipingWallets[i + 1].pubkey.slice(-5)}`;
        //   statusButtons.push([
        //     { text: `🔴 ${formattedToken2}`, callback_data: `sniping-status-${i + 1}` }
        //   ]);
        // }
      }
    }

    // Final content to return
    const content = [
      ...(statusButtons.length ? statusButtons : []), // Only add this row if there are tokens
      [{ text: "🔙 Back", callback_data: "back-to-buy-token" }, { text: "🗑 Close", callback_data: "back-to-main" }],
    ];

    return { title, content };

  } catch (error: any) {
    console.error("❌ Error fetching sniping wallet list:", error.message);
    return { title: "❌ Failed to fetch sniping wallets.", content: [] };
  }
};


export const addWallet = async (chatId: number, username: string, walletKey: string) => {
  let title: string;
  let walletAddress: PublicKey;

  try {
    console.log(`${username} : ${chatId} => In wallet setting for sniping page`);

    // 🔹 Decode Base58 key
    let decoded: Uint8Array;
    try {
      decoded = base58.decode(walletKey);
    } catch (error: any) {
      console.error("❌ Invalid Base58 encoding:", error.message);
      throw new Error("Invalid wallet key format.");
    }

    // 🔹 Determine if it's a **Private Key** or **Public Key**
    if (decoded.length === 64) {
      console.log("🔹 Detected Private Key → Deriving Public Key...");
      const keypair = Keypair.fromSecretKey(decoded);
      walletAddress = keypair.publicKey;
    } else if (decoded.length === 32) {
      walletAddress = new PublicKey(walletKey);
    } else {
      throw new Error("Invalid wallet key format.");
    }

    console.log("✅ Valid Wallet Address:", walletAddress.toBase58());

    // 🔹 Store Public Key in database
    const result = await helper.addWallets(chatId, Keypair.fromSecretKey(decoded));

    // 🔹 Format time
    const nowUtc = new Date();
    const formattedTime = new Intl.DateTimeFormat("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(nowUtc);

    if (result === false) {
      title = `🎉 Wallet Imported Successfully! 🎉

<code>${walletAddress.toBase58()}</code>

💎 Based Alert: Less than 10 gigachads found this. Elite snipers only. 💎

⏱ Last updated: ${formattedTime}`;
    } else if (result) {
      title = `🎉 Wallet Imported Successfully! 🎉

🟢 <code>${walletAddress.toBase58()}</code>

⏱ Last updated: ${formattedTime}`;
    } else {
      title = "Adding sniping token failed";
    }
  } catch (error: any) {
    console.error(`${username} : ${chatId} => Error: ${error.message}`);
    title = "❌ Incorrect wallet key format.";
  }

  // 🔹 Initial button UI state
  const content = [
    [{ text: "🔙 Back", callback_data: "sniper-wallets" }],
  ];
  return { title, content };
};

// export const deleteSnipingToken = async (chatId: number, username: string, tokenStr: string) => {
//   try {
//     console.log(`${username} : ${chatId} => In token setting for sniping page`);

//     const result = await helper.addSnipingToken(chatId, tokenStr);
//     // Get the current date and time formatted in the user's local timezone
//     const nowUtc = new Date();
//     const formattedTime = new Intl.DateTimeFormat("en-US", {
//       hour12: false,
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit", // Replace this with the actual user timezone
//     }).format(nowUtc);

//   } catch (err) {
//     console.log(err)
//   }
// }

// export const addSnipingToken = async (chatId: number, username: string, tokenStr: string) => {
//   let title: string
//   try {
//     console.log(`${username} : ${chatId} => In token setting for sniping page`)

//     const token = new PublicKey(tokenStr)
//     const result = await helper.addSnipingToken(chatId, tokenStr)

//     title = result === false ? "👏 Token already added to snipe list" :
//       result ?
//         `📚 Send the token address to snipe
//     📃 current sniping token list:  <code>${result}</code>
//       ` :
//         "😢 Adding sniping token failed"

//   } catch (error) {
//     console.log(`${username} : ${chatId} => Incorrect token address`)
//     title = 'Incorrect token address to snipe'
//   }
//   const content = [
//     [{ text: '⚔️ Sniping for Token', callback_data: 'set-sniping-token' }],
//     [{ text: '📊 Status', callback_data: 'sniping-status' }, { text: '▶️ Start/Stop', callback_data: 'sniping-stop-start' }],
//     [{ text: '⚙️ Setting', callback_data: 'sniping-setting' }, { text: '🔙 Back', callback_data: 'back-to-main' }],
//   ]
//   return { title, content }
// }

export const sniperStatus = async (chatId: number, username: string) => {
  const title = ``
  const content = [[]]


  return { title, content }

}

export const startSniper = async (chatId: number, username: string) => {

  const userInfo = await helper.findUser(chatId, username)
  console.log("🚀 ~ startSniper ~ userInfo:", userInfo)
  if (!userInfo || !userInfo.privateKey) {

    const title = `User info is not yet set`
    const content = [[{ text: "Back", callback_data: "sniping" }]]

    return { title, content }
  }


  startSniperBot(userInfo.privateKey, userInfo.snipingSolAmount)

  const title = ``
  const content = [[]]
  return { title, content }
}

export const copyTradeDashboard = async (chatId: number, username?: string) => {
  const title = `📊 Lynx Copy Trading 💰

💡 Follow the best traders!

🎯 Copy trading wallet: 


🟢 Copy trade setup is active
🔴 Copy trade setup is inactive

❗Please wait 10 seconds after each change for it to take effect.

⚠️ Changing your copy wallet? Remember to remake your tasks to use the new wallet for future transactions.

💵 Wallet balance: `

  const content = [
    [{ text: '🎯 Set target wallet address', callback_data: 'copy-set-target' }],
    [{ text: '⏸️ Pause copying', callback_data: 'copy-pause' }, { text: '▶️ Start copying', callback_data: 'copy-start' }],
    [{ text: '⚙️ Setting', callback_data: 'copy-setting' }, { text: '🔙 Back', callback_data: 'back-to-main' }],
  ]
  return { title, content }
}

export const limitOrderDashboard = async (chatId: number, username?: string) => {
  const title = `📏 Limit Order 🔄

🎯 Limit order wallet: 
💵 Wallet balance: `

  const content = [
    [{ text: '🛠️ Create a limit order', callback_data: 'limit-create' }],
    [{ text: '⏸️ Pause Limit Order', callback_data: 'limit-pause' }, { text: '▶️ Start/Resume Limit Order', callback_data: 'limit-start' }],
    [{ text: '⚙️ Setting', callback_data: 'limit-setting' }, { text: '🔙 Back', callback_data: 'back-to-main' }],
  ]
  return { title, content }
}

export const positionsDashboard = async (chatId: number, username?: string) => {
  const title = `📌 Positions Dashboard 🗂️
📢 Positions is an upcoming function and will be discussed soon! 🚀
`
  const content = [[{ text: '🔙 Back', callback_data: 'back-to-main' }]]
  return { title, content }
}

export const withdrawDashboard = async (chatId: number, username?: string) => {
  const title = `💸 Withdraw Funds 🪙
  
💵 Your wallet balance: ...SOL
📜 Your wallet contains the following tokens:
`

  const content = [
    [{ text: '💰 Withdraw SOL', callback_data: 'withdraw-sol' }, { text: '🔑 Withdraw Token', callback_data: 'withdraw-token' }],
    [{ text: '🔙 Back', callback_data: 'back-to-main' }]
  ]
  return { title, content }
}

export const referralDashboard = async (chatId: number, username?: string) => {
  const title = `🤝 Referral 🌟

🤝 Invite your friends and earn rewards with our referral program! 🚀
`

  const content = [
    [{ text: '💰 Withdraw SOL', callback_data: 'withdraw-sol' }, { text: '🔑 Withdraw Token', callback_data: 'withdraw-token' }],
    [{ text: '🔙 Back', callback_data: 'back-to-main' }]
  ]
  return { title, content }
}

export const manageWallet = async (chatId: number, connection: Connection) => {
  const userInfo = await helper.findUser(chatId);
  console.log("🚀 ~ manageWal ~ userInfo:", userInfo)
  if (!userInfo) return {
    title: "⚠️ Error happened in wallet managing operation",
    content: [[{ text: 'Back to setting page', callback_data: 'manage-wallet' }]]
  }

  let balance = 0
  try {
    const solBalance = await connection.getBalance(new PublicKey(userInfo.publicKey))
    balance = solBalance
  } catch (error) {
    console.log("Error happened while fetching SOL balance")
  }

  const title = ` 🛠 Wallet Management 🛠

💳 Your Wallet: ${userInfo?.publicKey ? `<code>${userInfo.publicKey}</code>` : "Currently, Manage Wallet is not set up. Please set the value"} 

💰 Balance: ${balance == 0 ? 0 : (balance / LAMPORTS_PER_SOL).toFixed(3)}SOL
  `
  const content = [
    [
      { text: '📥 Import Wallet', callback_data: 'import-wallet-confirm' },
      { text: '🆕 Create New Wallet', callback_data: 'create-new-wallet-confirm' }
    ],
    [
      { text: '🔙 Back', callback_data: 'back-to-main' }
    ]
  ]
  return { title, content }
}

export const createNewWalletConfirm = async (chatId: number) => {
  const title = `
    🛑  If you create a new wallet, your current wallet will be erased.

  🤔 Are you sure you want to proceed?
  `
  const content = [
    [
      { text: 'Yes', callback_data: 'create-new-wallet' },
      { text: 'No', callback_data: 'wallets-setting' }
    ]
  ]

  return { title, content }
}

export const createAnotherNewWalletConfirm = async (chatId: number) => {
  const title = `
    🛑  If you create a new wallet, your current wallet will be erased.

  🤔 Are you sure you want to proceed?
  `
  const content = [
    [
      { text: 'Yes', callback_data: 'create-another-new-wallet' },
      { text: 'No', callback_data: 'wallets-setting' }
    ]
  ]

  return { title, content }
}

export const deleteWalletConfirm = async (chatId: number, wallet: number) => {
  const userInfo = await helper.findUser(chatId);
  let balance = 0
  let selectWallet = ""
  try {
    if (!userInfo) return {
      title: "⚠️ Error happened in wallet managing operation",
      content: [[{ text: '🔙 Back to setting page', callback_data: 'wallets-setting' }]]
    }

    selectWallet = userInfo.allWallets[wallet].pubkey

    const solBalance = await connection.getBalance(new PublicKey(selectWallet))
    balance = solBalance
  } catch (error) {
    console.log("Error happened while fetching SOL balance")
  }
  const title = `
    🛑  Are you sure you want to delete your current wallet?
    In this case, all data in the wallet will be deleted.

  💳 <code>${selectWallet}</code>
  💰 Balance: ${balance}SOL

  🤔 Are you sure you want to delete it?
  `
  const content = [
    [
      { text: '✅ Yes', callback_data: `delete-wallet-${wallet}` },
      { text: '❌ No', callback_data: 'wallets-setting' }
    ]
  ]

  return { title, content }
}

export const deleteNewWallet = async (chatId: number, wallet: number) => {
  const userInfo = await helper.findUser(chatId);
  let selectWallet = ""
  let allWalletData: any[] = [];

  console.log("🚀 ~ manageWal ~ userInfo:", userInfo)
  if (!userInfo) return {
    title: "⚠️ Error happened in wallet managing operation",
    content: [[{ text: '🔙 Back to setting page', callback_data: 'wallets-setting' }]]
  }

  selectWallet = userInfo.allWallets[wallet].pubkey

  allWalletData = userInfo.allWallets.filter(w => w.pubkey !== selectWallet);

  console.log("allWalletData  =>", allWalletData)
  await helper.updateAddWallets(chatId, allWalletData)

  const title = `🛑 Your wallet has been successfully deleted

💳 <code>${selectWallet}</code>
  
💰 Add a new wallet or start a new task.
`

  const content = [[{ text: '✅ OK', callback_data: 'wallets-setting' }]]

  return { title, content }
}

export const createNewWallet = async (chatId: number) => {
  const keypair = Keypair.generate()

  await helper.setWallet(
    chatId,
    base58.encode(keypair.secretKey),
    keypair.publicKey.toBase58()
  )

  const title = `New wallet successfully created
  
Created new wallet public key: ${keypair.publicKey.toBase58()} 

Wallet SOL balance: 0SOL`

  const content = [[{ text: 'OK', callback_data: 'wallets-setting' }]]

  return { title, content }
}

export const createAnotherNewWallet = async (chatId: number) => {
  const keypair = Keypair.generate()

  await helper.addWallets(
    chatId,
    keypair
  )

  const title = `New aother wallet successfully created
  
Created new wallet public key: ${keypair.publicKey.toBase58()} 

Wallet SOL balance: 0SOL`

  const content = [[{ text: 'OK', callback_data: 'wallets-setting' }]]

  return { title, content }
}

export const importWalletConfirm = async (chatId: number) => {
  const title = `
  🛑 If you import a new secret key, your current wallet will be erased.

  🤔 Are you sure you want to proceed?
  `
  const content = [
    [
      { text: '✅ Yes', callback_data: 'import-wallet' },
      { text: '❌ No', callback_data: 'wallets-setting' }
    ]
  ]
  return { title, content }
}

export const importAnotherWalletConfirm = async (chatId: number) => {
  const title = `
  🛑 If you import a new secret key, your current wallet will be erased.

  🤔 Are you sure you want to proceed?
  `
  const content = [
    [
      { text: '✅ Yes', callback_data: 'import-another-wallet' },
      { text: '❌ No', callback_data: 'wallets-setting' }
    ]
  ]
  return { title, content }
}

export const importWallet = async (chatId: number, connection: Connection, secretKey: string) => {
  try {
    const keypair = Keypair.fromSecretKey(base58.decode(secretKey))
    const bal = await connection.getBalance(keypair.publicKey)
    const userInfo = await helper.findUser(chatId);

    await helper.setWallet(chatId, secretKey, keypair.publicKey.toBase58())
    const title = `🎉 Wallet Imported Successfully! 🎉

🔑 Public Key: <code>${keypair.publicKey.toBase58()}</code>

💰 Wallet Balance: ${bal == 0 ? `0 SOL` : (bal / LAMPORTS_PER_SOL).toFixed(3)} SOL

🎉 Your wallet has been successfully imported. You can now manage it!`
    const content = [
      [
        { text: '✅ Finish', callback_data: 'wallets-setting' }
      ]
    ];

    return { title, content }

  } catch (error) {
    console.log("Incorrect secret key");

    const title = `❌ Incorrect Secret Key ❌

The secret key you entered is invalid. Please double-check and try again.`;

    const content = [
      [
        { text: '🔑 Input Secret Key Again', callback_data: 'wallets-setting' }
      ]
    ];

    return { title, content };
  }
}

export const importanotherWallet = async (chatId: number, connection: Connection, secretKey: string) => {
  try {
    const keypair = Keypair.fromSecretKey(base58.decode(secretKey))
    const bal = await connection.getBalance(keypair.publicKey)
    const userInfo = await helper.findUser(chatId);


    await helper.addWallets(chatId, keypair)
    const title = `🎉 Wallet Imported Successfully! 🎉

🔑 Public Key: <code>${keypair.publicKey.toBase58()}</code>

💰 Wallet Balance: ${bal == 0 ? `0 SOL` : (bal / LAMPORTS_PER_SOL).toFixed(3)} SOL

🎉 Your wallet has been successfully imported. You can now manage it!`
    const content = [
      [
        { text: '✅ Finish', callback_data: 'wallets-setting' }
      ]
    ];

    return { title, content }

  } catch (error) {
    console.log("Incorrect secret key");

    const title = `❌ Incorrect Secret Key ❌

The secret key you entered is invalid. Please double-check and try again.`;

    const content = [
      [
        { text: '🔑 Input Secret Key Again', callback_data: 'wallets-setting' }
      ]
    ];

    return { title, content };
  }
}

export const showSecretKey = async (chatId: number, username: string) => {
  const userInfo = await helper.findUser(chatId);

  if (!userInfo) {
    console.log(`${username} : ${chatId} => In token setting for sniping page`)
    const title = `Failed to read user info`
    const content = [[{ text: 'Back', callback_data: 'manage-wallet' }]]

    return { title, content }
  }

  const title = `Your wallet secret key is 
  ${userInfo?.privateKey}
  `

  const content = [[{ text: 'Close', callback_data: 'manage-wallet' }]]
  return { title, content }
}

export const getTokenMetadata = async (tokenAddress: string) => {
  try {
    let mint: PublicKey;
    try {
      mint = new PublicKey(tokenAddress);
      console.log("mintAddress  ===>", mint);
    } catch (error: any) {
      console.error("❌ Invalid token address format:", error.message);
      throw new Error("Invalid token address.");
    }

    // ✅ Corrected method call (findByMint now expects { mintAddress })
    const metadata = await metaplex.nfts().findByMint({ mintAddress: mint });

    if (!metadata) {
      console.warn(`⚠️ No metadata found for ${tokenAddress}`);
      return { name: "Unknown Token", ticker: "UNKNOWN" };
    }

    return { name: metadata.name, ticker: metadata.symbol };
  } catch (error: any) {
    console.error(`❌ Failed to fetch metadata for ${tokenAddress}:`, error.message);
    return { name: "Unknown Token", ticker: "UNKNOWN" };
  }
}

export const handleWalletButtonPress = async (chatId: number, walletAddress: string, action: string) => {
  try {
    const userInfo = await helper.findUser(chatId);

    // Check if userInfo is null or undefined
    if (!userInfo) {
      console.error(`User with chatId ${chatId} not found.`);
      return; // Exit early if userInfo is null
    }

    const walletInTokenAddress = userInfo.buyToken?.some((token: any) =>
      token.wallets?.some((w: any) => w.address === walletAddress)
    );

    // If the wallet is already in the array, remove it
    if (walletInTokenAddress && action === "remove") {
      // Remove wallet from tokenAddress
      await helper.removeWalletFromTokenAddress(chatId, walletAddress);
    }

    // If the wallet is not in the array, add it
    if (!walletInTokenAddress && action === "add") {
      // Add wallet to tokenAddress
      await helper.addWalletToTokenAddress(chatId, walletAddress);
    }

    // After updating the database, you can return updated content
    return await selectWallets(chatId, userInfo.username);

  } catch (error: any) {
    console.error("Error processing wallet button press:", error.message);
  }
};


