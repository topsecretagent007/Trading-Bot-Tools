# PumpFun PumpSwap Migration Bundler

## Overview

This project is a Solana-based migration and bundling tool for PumpFun and PumpSwap tokens. It automates the process of launching, migrating, and buying tokens using multiple wallets, leveraging the Solana blockchain and the PumpFun/PumpSwap protocols.

## Features
- **Token Launch**: Automates the creation and initial buy of a new token.
- **Migration**: Supports migration of tokens using the PumpSwap protocol.
- **Bundled Buys**: Executes buy transactions from multiple wallets in a single bundle.
- **Simulation**: Simulates transactions before execution to ensure success.
- **CSV-Driven**: Uses a unified `task.csv` file to manage mint and wallet data.

## Project Structure
```
/ (root)
├── index.ts            # Main entry point for the bundler
├── buy.ts              # Buy logic for PumpSwap
├── createBuy.ts        # Token creation and initial buy logic
├── migrationBuy.ts     # Migration logic for PumpSwap
├── constants/          # Configuration and protocol constants
├── executor/           # Transaction execution logic (Jito, legacy)
├── keys/               # Wallet key files (auto-generated)
├── Log/                # Log files
├── src/                # PumpFun and PumpSwap SDK logic
├── utils/              # Utility functions (CSV parsing, logging, etc.)
├── task.csv            # Input CSV for mint and wallet data
├── rollup.config.js    # Rollup bundler config
├── package.json        # Project dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Setup

### Prerequisites
- Node.js (v18+ recommended)
- Yarn or npm
- Solana CLI (for wallet management, optional)

### Installation
```bash
# Install dependencies
yarn install
# or
npm install
```

## Configuration

### Environment Variables
Set the following environment variables in a `.env` file or your shell:
- `RPC_ENDPOINT` - Solana RPC endpoint
- `RPC_WEBSOCKET_ENDPOINT` - Solana WebSocket endpoint
- `RPC_LIL_JITO_ENDPOINT` - (optional) Jito endpoint
- `TOKEN_NAME`, `TOKEN_SYMBOL`, `DESCRIPTION`, `TOKEN_SHOW_NAME`, `TOKEN_CREATE_ON`, `TWITTER`, `TELEGRAM`, `WEBSITE` - Token metadata
- `FILE` - Path to the token image file (e.g., `image/1.jpg`)
- `DEV_BUY_AMOUNT`, `MIGRATION_BUY_AMOUNT` - Amounts for dev and migration buys
- `JITO_FEE` - Fee for Jito execution
- `SLIPPAGE` - Slippage percentage

### task.csv Format
The `task.csv` file should be in the root directory and follow this format:

```
type,privateKey,amount,group
mint,<mint_wallet_private_key>,,
wallet,<wallet1_private_key>,<amount>,1
wallet,<wallet2_private_key>,<amount>,2
wallet,<wallet3_private_key>,<amount>,3
... (add more wallets as needed)
```
- `type`: `mint` for the mint wallet, `wallet` for buy wallets
- `privateKey`: Base58-encoded private key
- `amount`: Amount to buy (in SOL)
- `group`: Wallet group (1, 2, or 3)

## Usage

### Main Script
To run the migration bundler:
```bash
yarn start
# or
npm start
```
This will:
- Parse `task.csv` for mint and wallet data
- Save wallet private keys to `keys/bundlerWallets_*.json`
- Create and simulate a bundle of transactions (token creation, migration, and buys)
- Execute the bundle if simulation succeeds
- Output the new token address and transaction logs

### Build (Optional)
To build a bundled JavaScript output (for deployment or advanced use):
```bash
yarn run rollup -c
# or
npm run rollup -c
```
The output will be in the `dist/` directory.

## Scripts
- `start`: Runs the main bundler (`index.ts`)
- `gather`: (Script referenced, but `gather.ts` not found in repo)

## Key Files
- `index.ts`: Main entry, orchestrates the workflow
- `buy.ts`, `createBuy.ts`, `migrationBuy.ts`: Core transaction logic
- `constants/`: Protocol and environment constants
- `utils/csvParser.ts`: Parses `task.csv` and manages wallet grouping
- `src/pumpfun/pumpfun.ts`: PumpFun SDK logic
- `src/pumpswap/instructions.ts`: PumpSwap instruction builders

## Notes
- Wallet key files in `keys/` are auto-generated and should be kept secure.
- Ensure your RPC endpoints and private keys are correct and have sufficient SOL for transactions.
- The project is intended for advanced users familiar with Solana, PumpFun, and PumpSwap protocols.

## License
ISC

## Contact
For questions or support, contact me on Telegram: [@topsecretagent_007](https://t.me/topsecretagent_007) 