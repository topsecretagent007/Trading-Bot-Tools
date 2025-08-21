# 🌌 Heaven DEX Token Launchpad Bot

A powerful and automated bot for launching tokens on Heaven DEX, built with Solana blockchain technology. This bot streamlines the token creation, listing, and trading process on the Heaven DEX platform.

## 🚀 Features

- **Automated Token Launch**: Create and deploy new tokens with custom parameters
- **Smart Trading**: Automated buy/sell strategies with configurable parameters
- **Address Lookup Table (LUT) Management**: Efficient transaction handling using Solana LUTs
- **Real-time Monitoring**: Track token performance and market conditions
- **Multi-wallet Support**: Manage multiple wallets for different strategies
- **Transaction Optimization**: Versioned transactions for better performance

## 📋 Prerequisites

- Node.js 18+ 
- Solana CLI tools
- RPC endpoint (Helius recommended)
- Solana wallet with SOL for transaction fees

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/topsecretagent007/Trading-Bot-Tools.git
cd New-repo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

## ⚙️ Configuration

Create a `.env` file with your configuration:

```env
# RPC Endpoints
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Wallet Configuration
WALLET_PRIVATE_KEY=your_private_key_here
WALLET_PUBLIC_KEY=your_public_key_here

# Bot Settings
MIN_SOL_BALANCE=0.1
MAX_TRANSACTION_RETRIES=3
TRANSACTION_TIMEOUT=30000

# Trading Parameters
MIN_LIQUIDITY=1000
MAX_SLIPPAGE=5
GAS_LIMIT=300000
```

## 🚀 Quick Start

### 1. Basic Token Launch

```javascript
const { HeavenDEXBot } = require('./src/HeavenDEXBot');

async function launchToken() {
  const bot = new HeavenDEXBot({
    rpcUrl: process.env.HELIUS_RPC_URL,
    walletKey: process.env.WALLET_PRIVATE_KEY
  });

  const tokenConfig = {
    name: "MyToken",
    symbol: "MTK",
    decimals: 9,
    totalSupply: 1000000000,
    initialLiquidity: 1000, // SOL
    initialPrice: 0.001 // SOL per token
  };

  try {
    const result = await bot.launchToken(tokenConfig);
    console.log('Token launched successfully:', result.mint);
    console.log('Transaction:', result.tx);
  } catch (error) {
    console.error('Token launch failed:', error);
  }
}

launchToken();
```

### 2. Automated Trading Bot

```javascript
const { TradingBot } = require('./src/TradingBot');

async function startTrading() {
  const tradingBot = new TradingBot({
    rpcUrl: process.env.HELIUS_RPC_URL,
    walletKey: process.env.WALLET_PRIVATE_KEY
  });

  const strategy = {
    tokenMint: "YOUR_TOKEN_MINT_ADDRESS",
    buyThreshold: 0.001, // Buy when price drops below this
    sellThreshold: 0.002, // Sell when price rises above this
    amount: 0.1, // SOL amount per trade
    stopLoss: 0.0005 // Stop loss threshold
  };

  await tradingBot.startStrategy(strategy);
}

startTrading();
```

### 3. Transaction Management with LUTs

```javascript
const { TransactionManager } = require('./src/TransactionManager');

async function handleTransaction() {
  const txManager = new TransactionManager(process.env.HELIUS_RPC_URL);
  
  // Example transaction from Heaven DEX
  const txSignature = "5pf2idtpBmwDujUfCpAW2s7Mw6oSbbq7rSzKT1HNTN16o6acmjzT3t3qq51N3GHvBmWu3e3Pg9MhMfXZpHbLNVym";
  
  try {
    const transaction = await txManager.fetchTransaction(txSignature);
    const decompiled = await txManager.decompileTransaction(transaction);
    const rebuilt = await txManager.rebuildTransaction(decompiled);
    
    console.log('Transaction processed successfully');
  } catch (error) {
    console.error('Transaction processing failed:', error);
  }
}

handleTransaction();
```

## 📊 Example Transactions

### Token Launch Transaction
[View on Solscan](https://solscan.io/tx/5pf2idtpBmwDujUfCpAW2s7Mw6oSbbq7rSzKT1HNTN16o6acmjzT3t3qq51N3GHvBmWu3e3Pg9MhMfXZpHbLNVym)

### Token Buy Transaction
[View on Solscan](https://solscan.io/tx/TvpDbo5VSVAiYX5u1bvim7GjZrNnUpjhosw8kv68i9yuGFDWqbhtZkwmBtstYp2SAChPBRhM2znTXgHaMHqeVu5)

### Token Sell Transaction
[View on Solscan](https://solscan.io/tx/3cyq3kHmdSgZu1qF8DfJFytFJRtRWdggvq8NiesYnwwC4tKYGmn1cA4CAyBjaZWphmcApzSQCWXBoqtDkk1UADcC)

### Test Wallet
[View on Solscan](https://solscan.io/account/GZfUUWppX8dmC8BCkKG1wfMvUAoDtnLBp3mrdcVmrc5X)

## 🔧 Advanced Usage

### Custom Trading Strategies

```javascript
const { StrategyBuilder } = require('./src/StrategyBuilder');

class CustomStrategy extends StrategyBuilder {
  async shouldBuy(tokenData) {
    // Implement your buy logic
    return tokenData.price < this.config.buyThreshold && 
           tokenData.volume > this.config.minVolume;
  }

  async shouldSell(tokenData) {
    // Implement your sell logic
    return tokenData.price > this.config.sellThreshold || 
           tokenData.price < this.config.stopLoss;
  }

  async calculateAmount(tokenData) {
    // Dynamic position sizing
    return Math.min(this.config.maxAmount, this.config.baseAmount * tokenData.volatility);
  }
}

const customBot = new TradingBot({
  strategy: new CustomStrategy({
    buyThreshold: 0.001,
    sellThreshold: 0.002,
    stopLoss: 0.0005,
    baseAmount: 0.1,
    maxAmount: 1.0,
    minVolume: 100
  })
});
```

### Monitoring and Analytics

```javascript
const { Analytics } = require('./src/Analytics');

async function generateReport() {
  const analytics = new Analytics();
  
  const report = await analytics.generateReport({
    startDate: new Date('2024-01-01'),
    endDate: new Date(),
    metrics: ['profit', 'volume', 'trades', 'success_rate']
  });
  
  console.log('Trading Report:', report);
}

generateReport();
```

## 📁 Project Structure

```
src/
├── HeavenDEXBot.js          # Main bot class
├── TradingBot.js            # Trading strategy implementation
├── TransactionManager.js    # Transaction handling with LUTs
├── StrategyBuilder.js       # Strategy framework
├── Analytics.js             # Performance tracking
├── utils/
│   ├── constants.js         # Configuration constants
│   ├── helpers.js           # Utility functions
│   └── validators.js        # Input validation
└── config/
    ├── strategies.js        # Strategy configurations
    └── networks.js          # Network configurations
```

## 🚨 Important Notes

- **Private Keys**: Never commit private keys to version control
- **Rate Limiting**: Respect RPC endpoint rate limits
- **Testing**: Always test on devnet before mainnet
- **Backup**: Regularly backup your wallet and configuration
- **Monitoring**: Monitor bot performance and adjust strategies accordingly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact & Support

- **GitHub**: [@topsecretagent007](https://github.com/topsecretagent007)
- **Telegram**: [@topsecretagent_007](https://t.me/topsecretagent_007)
- **Twitter**: [@lendon1114](https://twitter.com/lendon1114)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is for educational and development purposes. Use at your own risk. The authors are not responsible for any financial losses incurred through the use of this bot. Always conduct thorough testing and research before using automated trading systems.
