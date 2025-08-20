#!/bin/bash

# Solana Arbitrage Bot Setup Script
# This script sets up the development environment for the Solana arbitrage bot

set -e

echo "🚀 Setting up Solana Arbitrage Bot..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16+ is required. Current version: $(node --version)"
        exit 1
    fi
    print_success "Node.js $(node --version) is installed"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_success "npm $(npm --version) is installed"
    
    # Check Rust
    if ! command -v cargo &> /dev/null; then
        print_warning "Rust is not installed. Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
    fi
    print_success "Rust $(cargo --version) is installed"
    
    # Check Solana CLI
    if ! command -v solana &> /dev/null; then
        print_warning "Solana CLI is not installed. Installing Solana CLI..."
        sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
    fi
    print_success "Solana CLI $(solana --version) is installed"
    
    # Check Anchor
    if ! command -v anchor &> /dev/null; then
        print_warning "Anchor is not installed. Installing Anchor..."
        cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
        avm install latest
        avm use latest
    fi
    print_success "Anchor $(anchor --version) is installed"
}

# Install Node.js dependencies
install_node_deps() {
    print_status "Installing Node.js dependencies..."
    
    cd mainnet
    npm install
    print_success "Node.js dependencies installed"
    cd ..
}

# Build Rust components
build_rust_components() {
    print_status "Building Rust components..."
    
    cd offchain
    cargo build --release
    print_success "Rust components built successfully"
    cd ..
}

# Setup Solana configuration
setup_solana() {
    print_status "Setting up Solana configuration..."
    
    # Set default cluster to mainnet-beta
    solana config set --url mainnet-beta
    
    # Create a new keypair if it doesn't exist
    if [ ! -f "mainnet/localnet_owner.key" ]; then
        print_warning "Creating new wallet keypair..."
        solana-keygen new --outfile mainnet/localnet_owner.key --no-bip39-passphrase
    fi
    
    print_success "Solana configuration completed"
}

# Create configuration files
create_configs() {
    print_status "Creating configuration files..."
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Solana Arbitrage Bot Configuration
RPC_ENDPOINT=https://api.mainnet-beta.solana.com
WALLET_PATH=mainnet/localnet_owner.key
MIN_PROFIT_THRESHOLD=1000000
POOL_UPDATE_INTERVAL=5000
LOG_LEVEL=info
EOF
        print_success "Created .env configuration file"
    fi
    
    # Create .gitignore if it doesn't exist
    if [ ! -f ".gitignore" ]; then
        cat > .gitignore << EOF
# Dependencies
node_modules/
target/
dist/

# Environment files
.env
*.key

# Logs
*.log
log.txt

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Build outputs
build/
out/

# Temporary files
tmp/
temp/
EOF
        print_success "Created .gitignore file"
    fi
}

# Run tests
run_tests() {
    print_status "Running basic tests..."
    
    # Test TypeScript compilation
    cd mainnet
    npm run build
    print_success "TypeScript compilation successful"
    cd ..
    
    # Test Rust compilation
    cd offchain
    cargo check
    print_success "Rust compilation successful"
    cd ..
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Configure your wallet:"
    echo "   - Edit mainnet/localnet_owner.key or create a new one"
    echo "   - Fund your wallet with SOL for transaction fees"
    echo ""
    echo "2. Configure RPC endpoints:"
    echo "   - Edit .env file to set your preferred RPC endpoint"
    echo "   - Consider using a private RPC for better performance"
    echo ""
    echo "3. Run the bot:"
    echo "   cd offchain"
    echo "   cargo run --release -- --cluster mainnet"
    echo ""
    echo "4. Monitor logs:"
    echo "   tail -f log.txt"
    echo ""
    echo "📚 Documentation: https://github.com/moonbot777/Arbitrage-TS"
    echo "💬 Support: https://t.me/greenfoxfun"
    echo ""
}

# Main setup function
main() {
    echo "Starting setup process..."
    echo ""
    
    check_requirements
    install_node_deps
    build_rust_components
    setup_solana
    create_configs
    run_tests
    show_next_steps
}

# Run main function
main "$@" 