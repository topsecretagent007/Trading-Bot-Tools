# PumpFun & PumpSwap Migration Bundler

## Overview

This project is an advanced Solana-based migration and bundling tool for PumpFun and PumpSwap tokens. It automates the process of launching, migrating, and buying tokens using multiple wallets, leveraging the Solana blockchain and the PumpFun/PumpSwap protocols. The tool is designed for advanced users and developers who want to streamline token launches and migrations with robust simulation, logging, and bundle execution (Jito) support.

---

## Features
- **Automated Token Launch**: Create and initialize new tokens with full metadata and dev buy.
- **Migration Support**: Seamlessly migrate tokens using the PumpSwap protocol.
- **Bundled Buys**: Execute buy transactions from multiple wallets in a single atomic bundle.
- **Simulation**: Simulate all transactions before execution to ensure success.
- **Jito Bundle Execution**: Submit transaction bundles to Jito for MEV-optimized execution.
- **CSV-Driven**: Manage all mint and wallet data via a unified `task.csv` file.
- **Structured Logging**: All actions and results are logged to the `Log/` directory for audit and debugging.
- **Secure Wallet Management**: Wallet keys are auto-generated and stored in the `keys/` directory.

---

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

---

## Setup

### Prerequisites
- Node.js (v18+ recommended)
- Yarn or npm
- Solana CLI (for wallet management, optional)

### Installation
```bash
yarn install
# or
npm install
```

---

## Configuration

### Environment Variables
Set the following environment variables in a `.env` file or your shell:
- `RPC_ENDPOINT` - Solana RPC endpoint (required)
- `RPC_WEBSOCKET_ENDPOINT` - Solana WebSocket endpoint (required)
- `RPC_LIL_JITO_ENDPOINT` - Jito endpoint for bundle simulation/execution (required)
- `TOKEN_NAME`, `TOKEN_SYMBOL`, `DESCRIPTION`, `TOKEN_SHOW_NAME`, `TOKEN_CREATE_ON`, `TWITTER`, `TELEGRAM`, `WEBSITE` - Token metadata (required)
- `FILE` - Path to the token image file (e.g., `image/1.jpg`) (required)
- `DEV_BUY_AMOUNT`, `MIGRATION_BUY_AMOUNT` - Amounts for dev and migration buys (required)
- `JITO_FEE` - Fee for Jito execution (required)
- `SLIPPAGE` - Slippage percentage (required)

> **Note:** All configuration is loaded from environment variables and `task.csv`. The tool will exit if any required variable is missing.

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

---

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

---

## Scripts
- `start`: Runs the main bundler (`index.ts`)
- `gather`: (Script referenced, but `gather.ts` not found in repo)

---

## Utilities & Advanced Features
- **CSV Parsing**: `utils/csvParser.ts` robustly parses and validates wallet data.
- **Logging**: Uses `pino` for structured logs, output to `Log/`.
- **Jito Execution**: `executor/jito.ts` handles bundle simulation and submission to Jito.
- **Legacy Execution**: `executor/legacy.ts` provides fallback transaction execution logic.
- **SDK Logic**: `src/pumpfun/` and `src/pumpswap/` contain all protocol-specific logic and instruction builders.
- **Constants**: All protocol and environment constants are centralized in `constants/`.

---

## Security Notes
- **Wallet key files in `keys/` are auto-generated and should be kept secure.**
- **Never share your private keys or commit them to public repositories.**
- Ensure your RPC endpoints and private keys are correct and have sufficient SOL for transactions.

---

## Contribution

Contributions, issues, and feature requests are welcome! Feel free to fork the repo and submit pull requests.

- **GitHub:** [topsecretagent007](https://github.com/topsecretagent007)

---

## Contact

For questions, support, or collaboration:
- **GitHub:** [topsecretagent007](https://github.com/topsecretagent007)
- **Telegram:** [@topsecretagent_007](https://t.me/topsecretagent_007)

---

## License
ISC 