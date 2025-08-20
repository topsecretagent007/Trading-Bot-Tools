# Pumpfun Maker Bot

A sophisticated Solana-based automated market making and volume boosting bot for Pumpfun tokens. This bot optimizes market making processes through intelligent buy/sell operations to boost token volume and create liquidity.

## 🚀 Features

- **Automated Market Making**: Intelligent market making with configurable parameters
- **Volume Boosting**: Automated volume generation for tokens with distributed wallet operations
- **Multi-Wallet Support**: Distributed operations across multiple wallets for risk management
- **MEV Protection**: Bundle transactions using Jito for MEV protection
- **LUT Management**: Automated Lookup Table account management
- **Manual Controls**: Manual sell options and position management
- **Fund Gathering**: Automated fund collection and cleanup operations
- **Real-time Monitoring**: Comprehensive logging and transaction tracking

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Solana CLI tools
- A Solana wallet with sufficient SOL balance
- Jito API key (optional but recommended for MEV protection)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/moonbot777/Pumpfun-Maker-Bot.git

# Navigate to project directory
cd Pumpfun-Maker-Bot

# Install dependencies
npm install

# Build the project
npm run build
```

## ⚙️ Configuration

### 1. Environment Setup

Create a `.env` file in the root directory with the following configuration:

```env
# Solana RPC Configuration
RPC_ENDPOINT=https://api.mainnet-beta.solana.com
RPC_WEBSOCKET_ENDPOINT=wss://api.mainnet-beta.solana.com

# Wallet Configuration
MAIN_WALLET_PRIVATE_KEY=your_main_wallet_private_key_here

# Jito Configuration (for MEV protection)
JITO_KEY=your_jito_key_here
BLOCK_ENGINE_URL=https://amsterdam.mainnet.block-engine.jito.wtf

# Debug and Retry Settings
DEBUG_MODE=false
RETRY_MODE=false

# Wallet Numbers
MAKER_WALLET_NUM=5
VOLUME_WALLET_NUM=10
TOKEN_DISTRIBUTION_WALLET_NUM=5

# SOL Amounts
BUYER_SOL_AMOUNT=0.1
MINT_TO_MANUAL_GATHER=

# Swap Configuration
SWAP_AMOUNT_MIN=0.001
SWAP_AMOUNT_MAX=0.005
SWAP_AMOUNT_TOTAL=0.05
BUNDLE_SLIPPAGE=0.1

# Maker Configuration
MAKER_RUN_DURATION=300
MAKER_TOKEN_BUY_MIN=0.001
MAKER_TOKEN_BUY_MAX=0.005

# Volume Configuration
VOLUME_RUN_DURATION=300
VOLUME_TOKEN_BUY_MIN=0.001
VOLUME_TOKEN_BUY_MAX=0.005
```

### 2. Wallet Setup

1. **Generate a new wallet** or use an existing one
2. **Export the private key** in base58 format
3. **Add the private key** to the `MAIN_WALLET_PRIVATE_KEY` environment variable
4. **Fund the wallet** with sufficient SOL for operations (minimum 0.1 SOL recommended)

### 3. Jito Setup (Optional but Recommended)

1. **Register for Jito**: Visit [Jito Labs](https://jito.network/) to get your API key
2. **Add your Jito key** to the `JITO_KEY` environment variable
3. **Configure block engine URL** for your preferred region

### 4. RPC Configuration

- **Mainnet**: Use a reliable RPC endpoint (Helius, QuickNode, etc.)
- **Testnet**: Use Solana's public testnet RPC for testing
- **WebSocket**: Required for real-time transaction monitoring

## 🚀 Usage

### Basic Commands

```bash
# Start the main bot process
npm run start

# Test the configuration
npm run feat

# Build the project
npm run build

# Run the built application
npm run test
```

### Manual Operations

```bash
# Manual sell operation
npm run manual-sell

# Manual gather operation
npm run manual-gather

# Check bot status
npm run status

# Close LUT accounts
npm run close
```

## 📁 Project Structure

```
Pumpfun-Maker-Bot/
├── index.ts                 # Main entry point
├── test.ts                  # Test configuration
├── module/
│   ├── configs.ts          # Configuration constants
│   ├── pumpfun_sdk/        # PumpFun SDK implementation
│   ├── utils/              # Utility functions
│   └── executor/           # Transaction execution
├── processes/
│   ├── index.ts            # Main process orchestrator
│   ├── process_maker/      # Market making operations
│   └── process_volume/     # Volume boosting operations
└── package.json
```

## 🔧 Core Components

### Market Making Process
- **Distributed Operations**: Uses multiple wallets for market making
- **Configurable Parameters**: Adjustable buy/sell amounts and timing
- **Risk Management**: Automatic fund distribution and gathering

### Volume Boosting Process
- **Volume Generation**: Creates artificial volume through distributed trading
- **Timing Control**: Configurable duration and intervals
- **Balance Monitoring**: Automatic balance checks and fund management

### SDK Integration
- **PumpFun SDK**: Custom SDK for PumpFun protocol interactions
- **Bonding Curve Management**: Automated bonding curve operations
- **Global Account Management**: Protocol-level account interactions

## 🛡️ Security Features

- **MEV Protection**: Jito integration for bundle transactions
- **Slippage Protection**: Configurable slippage limits on trades
- **Multi-Wallet Distribution**: Risk management through wallet distribution
- **Automated Cleanup**: Automatic fund gathering and cleanup
- **Error Handling**: Comprehensive error handling and logging

## 📊 Monitoring and Logs

- **Transaction Logging**: All transactions are logged with Solscan links
- **Balance Tracking**: Real-time balance monitoring
- **Error Reporting**: Detailed error logs with debug mode
- **Performance Metrics**: Transaction success rates and timing

## 🔍 Troubleshooting

### Common Issues

1. **"RPC_ENDPOINT is not set"**
   - Ensure your `.env` file exists and contains the required variables
   - Check that the RPC endpoint is accessible

2. **"MAIN_WALLET_PRIVATE_KEY is not set"**
   - Add your wallet's private key to the `.env` file
   - Ensure the key is in base58 format

3. **Transaction failures**
   - Check wallet balance (minimum 0.1 SOL recommended)
   - Verify RPC endpoint reliability
   - Ensure proper slippage settings

4. **Bundle transaction failures**
   - Verify Jito configuration
   - Check network connectivity
   - Ensure sufficient compute units

### Testing

Run the test script to verify configuration:

```bash
npm run feat
```

### Debug Mode

Enable debug mode for detailed logging:

```env
DEBUG_MODE=true
```

## 📈 Performance Optimization

- **RPC Selection**: Use high-performance RPC endpoints
- **Wallet Distribution**: Optimize wallet numbers based on requirements
- **Timing Configuration**: Adjust intervals for optimal performance
- **Compute Units**: Configure appropriate compute unit limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and custom requirements:

- **Telegram**: [@greenfox](https://t.me/greenfox)
- **GitHub**: [moonbot777/Pumpfun-Maker-Bot](https://github.com/moonbot777/Pumpfun-Maker-Bot)
- **Issues**: Report bugs and feature requests on GitHub

## ⚠️ Disclaimer

This bot is for educational and research purposes. Use at your own risk and ensure compliance with local regulations. The developers are not responsible for any financial losses. Always test thoroughly on testnet before using on mainnet.

## 📄 License

This project is licensed under the ISC License.

## 🔄 Version History

- **v1.0.0**: Initial release with basic market making and volume boosting
- **v1.1.0**: Added Jito integration for MEV protection
- **v1.2.0**: Enhanced error handling and logging
- **v1.3.0**: Improved fund gathering and cleanup processes

---

**Made with ❤️ by [@greenfox](https://t.me/greenfox)**
