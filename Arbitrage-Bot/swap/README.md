# Solana Arbitrage Swap Program

A high-performance Solana program for executing arbitrage trades across multiple DEXes including Orca, Aldrin, Mercurial, Saber, and Serum.

## Features

- **Multi-DEX Support**: Execute swaps on Orca, Aldrin (V1/V2), Mercurial, Saber, and Serum
- **Arbitrage Optimization**: Built-in profit validation and revert mechanisms
- **State Management**: Comprehensive tracking of swap history, volume, and profits
- **Error Handling**: Robust error handling with custom error codes
- **Modern Architecture**: Built with Anchor 0.29.0 and Solana 1.17.0

## Dependencies

- **Anchor**: 0.29.0
- **Solana**: 1.17.0
- **Anchor SPL**: 0.29.0 (with DEX features)

## Program Structure

### Core Functions

- `init_program`: Initialize the swap program state
- `start_swap`: Begin a new swap sequence
- `profit_or_revert`: Verify profit and complete swap sequence
- `init_open_order`: Initialize Serum open orders account

### DEX Swap Functions

- `orca_swap`: Execute swap on Orca DEX
- `aldrin_swap_v1`: Execute swap on Aldrin V1 DEX
- `aldrin_swap_v2`: Execute swap on Aldrin V2 DEX
- `mercurial_swap`: Execute swap on Mercurial DEX
- `saber_swap`: Execute swap on Saber DEX
- `serum_swap`: Execute swap on Serum DEX

## State Management

The `SwapState` account tracks:
- Current swap input amount
- Total swaps executed
- Total volume processed
- Total profit accumulated
- Timestamps for creation and operations

## Error Handling

Custom error codes for:
- Invalid amounts
- Arithmetic overflow
- Invalid swap state
- Insufficient funds
- No profit scenarios
- Pool configuration errors
- Slippage tolerance exceeded

## Building and Testing

```bash
# Install dependencies
yarn install

# Build the program
anchor build

# Run tests
yarn test

# Deploy to localnet
anchor deploy
```

## Usage Example

```typescript
// Initialize swap state
await program.methods
  .initProgram()
  .accounts({...})
  .rpc();

// Start swap sequence
await program.methods
  .startSwap(new BN(1000000))
  .accounts({...})
  .rpc();

// Execute arbitrage across DEXes
await program.methods
  .orcaSwap()
  .accounts({...})
  .rpc();

// Verify profit and complete
await program.methods
  .profitOrRevert()
  .accounts({...})
  .rpc();
```

## Security Features

- Input validation for all swap amounts
- Overflow protection using checked arithmetic
- State validation before swap execution
- Profit verification with automatic revert
- Comprehensive error handling

## License

MIT License - see LICENSE file for details