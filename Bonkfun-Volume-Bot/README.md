# 🔄 Bonk.fun LaunchLab Volume Bot for Solana

A high-performance, automated trading bot built for the [Raydium LaunchLab](https://raydium.io) and the **Bonk.fun** token. This bot is engineered to simulate consistent buy/sell volume on LaunchLab pools, manage multiple wallets, and efficiently handle token account operations.

---

## 📌 Features

- 🔐 **Multi-Wallet Management**: Automatically creates and funds multiple wallets with SOL.
- 🤖 **Automated Volume Generation**: Randomized token buy transactions on selected LaunchLab pools.
- 💰 **Smart Sell & Sweep**: Detects previously used wallets, sells tokens, withdraws remaining SOL, and closes associated token accounts (ATA).
- 📊 **Real-Time Logging**: Tracks transaction history, volume metrics, and token statistics.
- ⚙️ **Fully Configurable**: Customize buy amounts, intervals, wallet distribution, and more via environment variables.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/justshiftjk/Bonkfun-Volume-Bot.git
cd Bonkfun-Volume-Bot
```
### 2. Create `.env` file

Create a `.env` file in the root directory and fill in the required fields:

```env
RPC=
SECRET_KEY=
API_KEY=XXXX-FFFFF
DEBUG=true
``` 

### 3. Install Dependencies

```bash
yarn install
```

### 4. Run with command

Build and Run in Production Mode:
```bash
yarn start
```

```package.json
"start": "node dist/index.js",
"dev": "ts-node-dev src/index.ts",
"build": "tsc",
```

## 🙌 Contributions
Feel free to open issues or submit pull requests to improve the bot.
