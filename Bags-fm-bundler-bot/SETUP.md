# Bags.fm Bundler Bot Setup Guide

This guide will help you set up and configure the Bags.fm Bundler Bot for automated trading on Solana.

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Solana CLI tools** - [Install guide](https://docs.solana.com/cli/install-solana-cli-tools)
- **A Solana wallet** with SOL for transactions
- **Reliable RPC endpoint** (Helius, QuickNode, etc.)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/moonbot777/Bags-fm-bundler-bot.git
cd Bags-fm-bundler-bot

# Install dependencies
yarn install
# or
npm install
```

### 3. Configuration

```bash
# Copy the example configuration
cp config.example.env .env

# Edit the .env file with your settings
nano .env
```

Fill in your `.env` file:

```env
PRIVATE_KEY=your_base58_encoded_private_key
RPC_ENDPOINT=https://your-rpc-endpoint.com
RPC_WEBSOCKET_ENDPOINT=wss://your-websocket-endpoint.com
DISTRIBUTE_WALLET_NUM=4
SLIPPAGE=0.01
```

### 4. Run the Bot

```bash
# Start the main bot
yarn start

# Or run in development mode with auto-restart
yarn dev
```

## ⚙️ Configuration Details

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PRIVATE_KEY` | Your wallet's private key (base58) | - | ✅ |
| `RPC_ENDPOINT` | Solana RPC endpoint | - | ✅ |
| `RPC_WEBSOCKET_ENDPOINT` | WebSocket endpoint | - | ✅ |
| `DISTRIBUTE_WALLET_NUM` | Number of buyer wallets | 4 | ❌ |
| `SLIPPAGE` | Trading slippage tolerance | 0.01 | ❌ |
| `BACKEND_URL` | Custom backend URL | - | ❌ |

### RPC Endpoints

**Recommended RPC providers:**
- [Helius](https://helius.xyz/) - Fast, reliable
- [QuickNode](https://quicknode.com/) - Enterprise-grade
- [Alchemy](https://alchemy.com/) - Developer-friendly

**Free alternatives (not recommended for production):**
- `https://api.mainnet-beta.solana.com`
- `https://solana-api.projectserum.com`

## 🔧 Advanced Configuration

### Custom Jito Fee

```env
JITO_FEE=2000000  # 0.002 SOL
```

### Custom RPC Timeout

```env
RPC_TIMEOUT=60000  # 60 seconds
```

### Debug Mode

```env
DEBUG=true
```

## 📊 Trading Parameters

### Default Settings

- **Trade Amount**: 0.0005 SOL per transaction
- **Slippage**: 1% (configurable)
- **Compute Units**: 1,000,000 per transaction
- **Priority Fee**: 100,000 micro-lamports
- **Max Transaction Size**: 1,232 bytes

### Customization

You can modify these values in `constants/constants.ts`:

```typescript
export const DEFAULT_TRADE_AMOUNT = 1000000; // 0.001 SOL
export const COMPUTE_UNIT_PRICE = 200_000;   // Higher priority
export const COMPUTE_UNIT_LIMIT = 2_000_000; // More compute units
```

## 🛡️ Security Considerations

### Private Key Management

- **Never share your private key**
- Use environment variables, not hardcoded values
- Consider using a dedicated trading wallet
- Test on devnet first

### RPC Security

- Use HTTPS endpoints only
- Avoid public/free RPC nodes for production
- Monitor for unusual activity

### Transaction Limits

- Set reasonable trade amounts
- Monitor wallet balances
- Use slippage protection

## 🔍 Monitoring & Debugging

### Logs

The bot provides detailed logging:

```
🚀 Starting Bags.fm Bundler Bot...
📊 Program ID: BAGSRzq3QTeQ1f7BsAkf6e5Qw49HkQLbz2Xbfz7eQLVV
🔑 Main wallet: YourWalletAddress...
👤 Buyer 1: BuyerAddress1...
```

### Transaction Tracking

- All transactions are logged with signatures
- Solscan links are provided for verification
- Jito bundle status is monitored

### Error Handling

- Comprehensive error logging
- Graceful failure handling
- Retry mechanisms for network issues

## 🚨 Troubleshooting

### Common Issues

**1. RPC Connection Failed**
```bash
# Check your RPC endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
  https://your-rpc-endpoint.com
```

**2. Insufficient Balance**
```bash
# Check wallet balance
solana balance YourWalletAddress
```

**3. Transaction Size Too Large**
- Reduce batch size in `src/buy.ts`
- Optimize instruction count
- Use address lookup tables

**4. Jito Bundle Failed**
- Check Jito endpoint status
- Verify transaction format
- Monitor network congestion

### Debug Mode

Enable debug logging:

```env
DEBUG=true
```

### Network Status

Check Solana network status:
- [Solana Status](https://status.solana.com/)
- [Jito Status](https://status.jito.network/)

## 📚 Additional Resources

- [Solana Documentation](https://docs.solana.com/)
- [Bags.fm Documentation](https://docs.bags.fm/)
- [Jito Documentation](https://docs.jito.network/)
- [GitHub Repository](https://github.com/moonbot777/Bags-fm-bundler-bot)

## 🤝 Support

- **GitHub Issues**: [Create an issue](https://github.com/moonbot777/Bags-fm-bundler-bot/issues)
- **Twitter**: [@greenfoxworld](https://twitter.com/greenfoxworld)
- **Telegram**: [@greenfoxfun](https://t.me/greenfoxfun)

## ⚠️ Disclaimer

This software is for educational purposes only. Use at your own risk. The authors are not responsible for any financial losses incurred from using this bot.

- Test thoroughly on devnet before mainnet
- Start with small amounts
- Monitor all transactions carefully
- Understand the risks of automated trading
