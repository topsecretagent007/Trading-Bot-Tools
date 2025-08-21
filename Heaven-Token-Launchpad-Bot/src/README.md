# Heaven DEX Token Launchpad Bot - Source Code

This directory contains the source code for the Heaven DEX Token Launchpad Bot, organized into a clean, modular architecture.

## 📁 Directory Structure

```
src/
├── components/           # Core business logic components
│   ├── TokenCreator.ts  # Token creation functionality
│   ├── TokenTrader.ts   # Token trading functionality
│   └── TokenManager.ts  # Token management and metadata
├── config/              # Configuration management
│   └── index.ts        # App configuration and environment validation
├── types/               # TypeScript type definitions
│   └── index.ts        # All interfaces, types, and enums
├── utils/               # Utility functions
│   └── helpers.ts      # Common helper functions
├── HeavenTokenLaunchpadBot.ts  # Main application class
├── index.ts            # Entry point with barrel exports
└── README.md           # This file
```

## 🧩 Components

### TokenCreator
Handles the creation of new SPL tokens on Solana:
- Creates new token mints
- Sets up associated token accounts
- Uploads metadata to IPFS
- Supports custom token parameters

### TokenTrader
Manages token trading operations on Heaven DEX:
- Buy tokens with SOL
- Sell tokens for SOL
- Price calculations and slippage handling
- Trading history tracking

### TokenManager
Provides comprehensive token management features:
- Token metadata retrieval
- Balance checking
- Token statistics
- Portfolio management

## ⚙️ Configuration

The `config` directory centralizes all application settings:
- Solana network configuration
- Heaven DEX protocol settings
- IPFS storage configuration
- Environment variable validation

## 🔧 Types

Comprehensive TypeScript types for:
- Token metadata and information
- Trading operations and results
- Configuration interfaces
- API responses and error handling

## 🛠️ Utilities

Helper functions for:
- Number formatting and display
- Public key validation and shortening
- Time calculations
- Error handling and retry logic

## 🚀 Usage

### Basic Usage
```typescript
import { HeavenTokenLaunchpadBot } from './src';

const bot = new HeavenTokenLaunchpadBot();
await bot.start();
```

### Component Usage
```typescript
import { TokenCreator, TokenTrader, TokenManager } from './src';

// Create tokens
const creator = new TokenCreator(connection);
const token = await creator.createCustomToken('My Token', 'MTK', 'Description', 'image-url');

// Trade tokens
const trader = new TokenTrader(connection);
const buyResult = await trader.buyToken(mint, 0.1);

// Manage tokens
const manager = new TokenManager(connection);
const metadata = await manager.getTokenMetadata(mint);
```

## 🔒 Security Features

- Environment variable validation
- Error handling and logging
- Transaction validation
- Secure key management

## 📊 Logging

Comprehensive logging with:
- Emoji indicators for better readability
- Timestamp information
- Error tracking and reporting
- Performance monitoring

## 🧪 Testing

The modular architecture makes it easy to test individual components:
- Mock Solana connections for testing
- Isolated component testing
- Error scenario testing
- Performance benchmarking

## 🔄 Future Enhancements

- Real-time price feeds
- Advanced trading strategies
- Portfolio analytics
- Multi-chain support
- Web interface

---

**Built with ❤️ by TopSecretAgent007**
