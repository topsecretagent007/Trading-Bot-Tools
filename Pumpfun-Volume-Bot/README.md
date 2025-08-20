# Pumpfun Volume and Market Maker Bot

A sophisticated Solana-based bot for automated market making and volume boosting on Pumpfun tokens. This bot optimizes market making processes through automatic buy/sell operations to boost token volume.

## Features

- **Volume Boosting**: Automated volume generation for tokens
- **Market Making**: Intelligent market making with configurable parameters
- **Automated Trading**: Buy/sell operations with slippage protection
- **Manual Controls**: Manual sell options and position management
- **LUT Management**: Automated LUT (Lookup Table) account management
- **Bundle Transactions**: MEV-protected transactions using Jito
- **Multi-Wallet Support**: Distributed operations across multiple wallets

## Installation

```bash
# Clone the repository
git clone https://github.com/moonbot777/Pumpfun-Volume-Bot.git

# Navigate to project directory
cd Pumpfun-Volume-Bot

# Install dependencies
npm install
```

## Configuration

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
```

### 2. Wallet Setup

1. **Generate a new wallet** or use an existing one
2. **Export the private key** in base58 format
3. **Add the private key** to the `MAIN_WALLET_PRIVATE_KEY` environment variable
4. **Fund the wallet** with sufficient SOL for operations

### 3. Jito Setup (Optional but Recommended)

1. **Register for Jito**: Visit [Jito Labs](https://jito.network/) to get your API key
2. **Add your Jito key** to the `JITO_KEY` environment variable
3. **Configure block engine URL** for your preferred region

### 4. RPC Configuration

- **Mainnet**: Use a reliable RPC endpoint (Helius, QuickNode, etc.)
- **Testnet**: Use Solana's public testnet RPC for testing
- **WebSocket**: Required for real-time transaction monitoring

## Usage

```bash
# Start the volume bot
npm run start

# Manual sell operation
npm run manual-sell

# Manual gather operation
npm run manual-gather

# Check status
npm run status

# Build the project
npm run build
```

## Scripts

- `npm run start`: Start the main volume bot
- `npm run manual-sell`: Execute manual sell operations
- `npm run manual-gather`: Execute manual gather operations
- `npm run status`: Check bot status
- `npm run build`: Build the TypeScript project
- `npm run test`: Test the built application

## Architecture

The bot is structured with the following components:

- **Module System**: Core utilities and SDK integrations
- **Process Management**: Volume and market making processes
- **Executor**: Transaction execution and bundling
- **Utils**: Helper functions and configurations

## Security Features

- MEV protection through Jito integration
- Slippage protection on trades
- Multi-wallet distribution for risk management
- Automated fund gathering and cleanup

## Contact

For support and custom requirements:
- **Telegram**: [@greenfox](https://t.me/greenfox)
- **GitHub**: [moonbot777/Pumpfun-Volume-Bot](https://github.com/moonbot777/Pumpfun-Volume-Bot)

## Troubleshooting

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

### Logs

- Logs are saved in the `logs/` directory
- Each token operation creates a separate log file
- Check logs for detailed error information

## Disclaimer

This bot is for educational and research purposes. Use at your own risk and ensure compliance with local regulations. The developers are not responsible for any financial losses.
