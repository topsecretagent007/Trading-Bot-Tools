# Heaven DEX Token Launchpad Bot - Documentation

## 📖 Overview

The **Heaven DEX Token Launchpad Bot** is a comprehensive DeFi tool built on Solana blockchain that enables users to create, deploy, and trade tokens using the Heaven DEX protocol. This project serves as both a functional trading bot and a developer reference for Solana-based DeFi integrations.

## 👨‍💻 Developer

**TopSecretAgent007** - Blockchain Developer & DeFi Enthusiast

- 🐦 **Twitter**: [@lendon1114](https://x.com/lendon1114)
- 💬 **Telegram**: [@topsecretagent_007](https://t.me/topsecretagent_007)
- 🐙 **GitHub**: [@topsecretagent007](https://github.com/topsecretagent007)

## 🚀 Features

### Core Functionality
- **Token Creation**: Deploy custom tokens with configurable metadata
- **Token Trading**: Buy and sell tokens on Heaven DEX
- **Metadata Management**: IPFS-based token metadata storage
- **Solana Integration**: Full Solana blockchain compatibility

### Technical Features
- **Address Lookup Tables (LUTs)**: Resolve and utilize Heaven DEX LUTs
- **Transaction Handling**: Decompile and rebuild Solana transactions
- **Error Handling**: Comprehensive error handling and logging
- **Configuration Management**: Centralized configuration system

## 🛠 Tech Stack

### Blockchain & DEX
- **Solana**: High-performance blockchain platform
- **Heaven DEX**: Decentralized exchange protocol
- **SPL Token**: Solana Program Library for token standards

### Development Tools
- **TypeScript**: Type-safe JavaScript development
- **Node.js**: Server-side JavaScript runtime
- **Web3.js**: Ethereum-compatible JavaScript API
- **Solana Web3.js**: Solana blockchain JavaScript API

### Storage & Infrastructure
- **IPFS**: Decentralized file storage
- **Pinata**: IPFS pinning service integration

## 📁 Project Structure

```
Heaven-Token-Launchpad-Bot/
├── index.ts              # Main application entry point
├── utils.ts              # Core utility functions
├── config.ts             # Configuration management
├── type/
│   └── index.ts         # TypeScript type definitions
├── images/               # Token image assets
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── env.example           # Environment variables template
├── README.md             # Project overview
└── DOCUMENTATION.md      # This file
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta

# Heaven DEX Configuration
HEAVEN_DEX_PROGRAM_ID=your_program_id_here
HEAVEN_DEX_MARKET_ADDRESS=your_market_address_here

# IPFS Configuration
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Logging
LOG_LEVEL=info
```

### Configuration File

The `config.ts` file centralizes all project settings:

```typescript
import { CONFIG } from './config';

// Access configuration
const rpcUrl = CONFIG.solana.rpcUrl;
const programId = CONFIG.heavenDex.programId;
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Solana CLI tools
- Solana wallet (Phantom, Solflare, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/topsecretagent007/Trading-Bot-Tools.git
cd Heaven-Token-Launchpad-Bot

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Start the bot
npm start

# Development mode with auto-reload
npm run dev
```

### Building

```bash
# Compile TypeScript to JavaScript
npm run build

# The compiled code will be in the ./dist directory
```

## 📚 API Reference

### Core Functions

#### `createToken()`
Creates a new SPL token on Solana.

```typescript
import { createToken } from './utils';

const result = await createToken();
if (result) {
  console.log(`Token created: ${result.mint.toBase58()}`);
}
```

#### `buyToken(mint: PublicKey, amount: number)`
Buys tokens from the specified mint address.

```typescript
import { buyToken } from './utils';

const success = await buyToken(mintAddress, 0.005);
if (success) {
  console.log('Buy transaction successful');
}
```

#### `sellToken(mint: PublicKey, amount: number)`
Sells tokens from the specified mint address.

```typescript
import { sellToken } from './utils';

const success = await sellToken(mintAddress, 1000);
if (success) {
  console.log('Sell transaction successful');
}
```

### Utility Functions

#### `sleep(ms: number)`
Delays execution for the specified milliseconds.

```typescript
import { sleep } from './utils';

await sleep(2000); // Wait 2 seconds
```

#### `getTokenBalance(mint: PublicKey, owner: PublicKey)`
Gets the token balance for a specific owner.

```typescript
import { getTokenBalance } from './utils';

const balance = await getTokenBalance(mintAddress, ownerAddress);
console.log(`Balance: ${balance}`);
```

## 🔧 Customization

### Adding New Token Types

Extend the `metadataInfo` interface in `type/index.ts`:

```typescript
export interface metadataInfo {
  name: string;
  symbol: string;
  image: string;
  description: string;
  createdOn: string;
  twitter?: string;
  website?: string;
  telegram?: string;
  github?: string;
  developer?: string;
  // Add your custom fields here
  customField?: string;
}
```

### Custom Token Creation

Modify the `createToken` function in `utils.ts` to add custom logic:

```typescript
export const createCustomToken = async (metadata: CustomMetadata) => {
  // Your custom token creation logic
  const mint = await createMint(/* your parameters */);
  
  // Add custom metadata handling
  await uploadMetadataToIPFS(metadata);
  
  return mint;
};
```

## 🚨 Error Handling

The project includes comprehensive error handling:

```typescript
try {
  const result = await createToken();
  if (!result) {
    throw new Error('Token creation failed');
  }
} catch (error) {
  console.error('Error:', error);
  // Handle error appropriately
}
```

## 📊 Logging

Configure logging levels and formats in `config.ts`:

```typescript
logging: {
  level: process.env.LOG_LEVEL || 'info',
  enableEmojis: true,
  enableTimestamps: true
}
```

## 🔒 Security Considerations

- **Private Keys**: Never hardcode private keys in your code
- **Environment Variables**: Use `.env` files for sensitive configuration
- **RPC Endpoints**: Use trusted RPC endpoints for production
- **Transaction Validation**: Always validate transactions before signing

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with specific environment
NODE_ENV=test npm test
```

## 📦 Deployment

### Production Build

```bash
# Build the project
npm run build

# Start production server
node dist/index.js
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- 📧 **Email**: Contact via GitHub
- 💬 **Telegram**: [@topsecretagent_007](https://t.me/topsecretagent_007)
- 🐦 **Twitter**: [@lendon1114](https://x.com/lendon1114)
- 🐙 **GitHub Issues**: [Create an issue](https://github.com/topsecretagent007/Trading-Bot-Tools/issues)

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Basic token creation and trading functionality
- Solana blockchain integration
- Heaven DEX protocol support
- Comprehensive documentation

---

**Built with ❤️ by TopSecretAgent007**
