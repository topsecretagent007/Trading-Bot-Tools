# Solana Arbitrage Bot Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)
8. [Security](#security)
9. [Performance](#performance)
10. [Contributing](#contributing)

## Overview

The Solana Arbitrage Bot is a high-performance, multi-DEX arbitrage system that automatically detects and executes profitable trading opportunities across multiple decentralized exchanges on Solana.

### Key Features

- **Multi-DEX Support**: Orca, Serum, Aldrin, Saber, Mercurial
- **Atomic Transactions**: All swaps execute atomically with profit-or-revert protection
- **MEV Protection**: Built-in protection against front-running and sandwich attacks
- **Real-time Monitoring**: Continuous market scanning for opportunities
- **Risk Management**: Automatic profit validation and transaction simulation

## Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Off-chain    │    │   On-chain     │    │   Monitoring    │
│   Detection    │    │   Execution     │    │   & Analytics   │
│                │    │                │    │                │
│ • Price Feeds  │    │ • Smart        │    │ • Transaction   │
│ • Arbitrage    │    │   Contracts    │    │   Analysis      │
│   Detection    │    │ • Atomic Swaps │    │ • Performance   │
│ • Path Finding │    │ • Profit Check │    │   Tracking      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Solana        │
                    │   Network       │
                    │                │
                    │ • RPC Nodes    │
                    │ • Validators   │
                    │ • DEX Programs │
                    └─────────────────┘
```

### Data Flow

1. **Market Data Collection**: Off-chain component fetches price feeds from multiple DEXes
2. **Arbitrage Detection**: Brute-force search algorithm identifies profitable opportunities
3. **Transaction Construction**: Atomic transaction with all necessary swaps is built
4. **Execution**: Transaction is submitted to Solana network with profit validation
5. **Monitoring**: On-chain analysis tracks performance and profitability

## Installation

### Prerequisites

- **Node.js 16+** and npm/yarn
- **Rust 1.70+** and Cargo
- **Solana CLI** tools
- **Anchor Framework**

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/moonbot777/Arbitrage-TS.git
cd Arbitrage-TS

# Run the setup script
chmod +x setup.sh
./setup.sh
```

### Manual Installation

```bash
# Install Rust dependencies
cd offchain
cargo build --release

# Install Node.js dependencies
cd ../mainnet
npm install

# Build TypeScript
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Network Configuration
RPC_ENDPOINT=https://api.mainnet-beta.solana.com
WALLET_PATH=mainnet/localnet_owner.key

# Trading Parameters
MIN_PROFIT_THRESHOLD=1000000
MAX_SLIPPAGE=0.5
MAX_TRANSACTION_SIZE=4

# Performance Settings
POOL_UPDATE_INTERVAL=5000
PRICE_FEED_INTERVAL=1000
ARBITRAGE_SEARCH_INTERVAL=2000

# Logging
LOG_LEVEL=info
LOG_FILE=log.txt
```

### Configuration File

The `config.json` file contains detailed settings for:

- **Network endpoints** for different environments
- **DEX configurations** with priorities and limits
- **Token whitelist/blacklist** for trading pairs
- **Security settings** and rate limiting
- **Performance tuning** parameters
- **Notification settings** for alerts

## Usage

### Starting the Bot

```bash
# Run in development mode
cd offchain
cargo run -- --cluster mainnet

# Run in production mode
cargo run --release -- --cluster mainnet

# Run with custom configuration
cargo run --release -- --cluster mainnet --config ../config.json
```

### Monitoring

```bash
# View real-time logs
tail -f log.txt

# Check ATA balances
cd mainnet
npm run dev

# Analyze transactions
cd onchain
node analyze.js
```

### Stopping the Bot

```bash
# Graceful shutdown
pkill -f "cargo run"

# Force stop
pkill -9 -f "cargo run"
```

## API Reference

### Off-chain API

#### Arbitrager Class

```rust
pub struct Arbitrager {
    pub token_mints: Vec<Pubkey>,
    pub graph_edges: Vec<HashSet<usize>>,
    pub graph: PoolGraph,
    pub cluster: Cluster,
    pub owner: Rc<Keypair>,
    pub program: Program,
    pub connection: RpcClient,
}
```

#### Key Methods

- `brute_force_search()`: Main arbitrage detection algorithm
- `get_arbitrage_instructions()`: Constructs transaction instructions
- `send_ixs()`: Submits transactions to network

### On-chain API

#### Swap Program

```rust
#[program]
pub mod tmp {
    pub fn start_swap(ctx: Context<TokenAndSwapState>, swap_input: u64) -> Result<()>
    pub fn profit_or_revert(ctx: Context<TokenAndSwapState>) -> Result<()>
    pub fn orca_swap(ctx: Context<OrcaSwap>) -> Result<()>
    pub fn serum_swap(ctx: Context<SerumSwap>, side: Side) -> Result<()>
    // ... other DEX integrations
}
```

### Configuration API

```typescript
interface Config {
  network: NetworkConfig;
  trading: TradingConfig;
  dexes: DexConfig;
  tokens: TokenConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
  notifications: NotificationConfig;
  advanced: AdvancedConfig;
}
```

## Troubleshooting

### Common Issues

#### 1. RPC Connection Errors

**Symptoms**: Connection timeouts, failed transactions
**Solutions**:
- Check RPC endpoint availability
- Use private RPC for better performance
- Increase connection timeout settings

#### 2. Insufficient SOL for Fees

**Symptoms**: Transaction failures, "insufficient funds" errors
**Solutions**:
- Fund wallet with SOL for transaction fees
- Reduce transaction size or frequency
- Use fee optimization strategies

#### 3. Slippage Errors

**Symptoms**: Transaction reverts due to price impact
**Solutions**:
- Increase slippage tolerance
- Reduce trade size
- Use more liquid pools

#### 4. Pool Not Found

**Symptoms**: "Pool not found" errors
**Solutions**:
- Update pool metadata
- Check DEX configuration
- Verify token addresses

### Debug Mode

Enable debug logging:

```bash
# Set log level to debug
export RUST_LOG=debug

# Run with verbose output
cargo run --release -- --cluster mainnet --verbose
```

### Performance Monitoring

```bash
# Monitor system resources
htop

# Check network usage
iftop

# Monitor disk I/O
iotop
```

## Security

### Best Practices

1. **Private Keys**: Never commit private keys to version control
2. **RPC Security**: Use private RPC endpoints when possible
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Monitoring**: Set up alerts for unusual activity
5. **Updates**: Keep dependencies updated for security patches

### Risk Management

- **Position Sizing**: Limit maximum trade size
- **Stop Losses**: Implement automatic stop losses
- **Diversification**: Trade across multiple DEXes
- **Monitoring**: Real-time profit/loss tracking

### Security Checklist

- [ ] Private keys stored securely
- [ ] RPC endpoints are private/trusted
- [ ] Rate limiting enabled
- [ ] Monitoring and alerts configured
- [ ] Regular security updates
- [ ] Backup and recovery procedures

## Performance

### Optimization Tips

1. **RPC Selection**: Use high-performance RPC endpoints
2. **Connection Pooling**: Reuse connections when possible
3. **Caching**: Cache frequently accessed data
4. **Parallel Processing**: Use multiple threads for searches
5. **Memory Management**: Monitor and optimize memory usage

### Benchmarking

```bash
# Performance test
cargo bench

# Load testing
cargo test --release

# Memory profiling
cargo install flamegraph
cargo flamegraph
```

### Metrics

Track these key metrics:

- **Success Rate**: Percentage of successful transactions
- **Profitability**: Average profit per trade
- **Latency**: Time from detection to execution
- **Throughput**: Number of trades per hour
- **Error Rate**: Percentage of failed transactions

## Contributing

### Development Setup

```bash
# Fork the repository
git clone https://github.com/your-username/Arbitrage-TS.git

# Create feature branch
git checkout -b feature/new-dex-integration

# Make changes and test
cargo test
npm test

# Submit pull request
git push origin feature/new-dex-integration
```

### Code Style

- Follow Rust and TypeScript style guides
- Add comprehensive tests for new features
- Update documentation for API changes
- Use meaningful commit messages

### Testing

```bash
# Run all tests
cargo test
npm test

# Run specific tests
cargo test test_arbitrage_detection
npm test -- --grep "balance"

# Integration tests
cargo test --test integration
```

---

## Support

- **Documentation**: [GitHub Wiki](https://github.com/moonbot777/Arbitrage-TS/wiki)
- **Issues**: [GitHub Issues](https://github.com/moonbot777/Arbitrage-TS/issues)
- **Telegram**: [@greenfoxfun](https://t.me/greenfoxfun)
- **Discord**: [Join our community](https://discord.gg/arbitrage-bot)

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Disclaimer

This software is for educational and research purposes. Trading cryptocurrencies involves substantial risk of loss. Use at your own risk and never invest more than you can afford to lose. 