# Raypump Copy Trading Bot Makefile
# This Makefile provides commands to build, run, and manage the copy trading bot

# Variables
TARGET_X86_64 = x86_64-pc-windows-gnu
TARGET_I686 = i686-pc-windows-gnu
PROJECT_NAME = $(shell basename "$(CURDIR)") # Change this to your project name
PROJECT_PATH = target/release/ # Change this to your project path
CARGO = cargo
EXTRA_FILES = .env targetlist.txt

# Default target
.PHONY: help
help:
	@echo "Raypump Copy Trading Bot - Available Commands:"
	@echo ""
	@echo "Setup Commands:"
	@echo "  install       - Install necessary packages and configure Rust targets"
	@echo "  setup         - Setup environment files (copy examples)"
	@echo ""
	@echo "Build Commands:"
	@echo "  build         - Build the bot for current platform"
	@echo "  build-x86_64  - Build for 64-bit Windows"
	@echo "  build-i686    - Build for 32-bit Windows"
	@echo "  clean         - Clean the target directory"
	@echo ""
	@echo "Run Commands:"
	@echo "  start         - Start the bot with PM2"
	@echo "  stop          - Stop the bot"
	@echo "  restart       - Restart the bot"
	@echo "  logs          - View bot logs"
	@echo "  status        - Check bot status"
	@echo ""
	@echo "Test Commands:"
	@echo "  test-ping     - Test Yellowstone gRPC connection"
	@echo "  test-build    - Test build without running"
	@echo ""
	@echo "Utility Commands:"
	@echo "  package       - Package for distribution"
	@echo "  check-env     - Validate environment configuration"

# Setup target to copy example files
.PHONY: setup
setup:
	@echo "Setting up environment files..."
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo "Created .env file from example. Please edit with your configuration."; \
	else \
		echo ".env file already exists."; \
	fi
	@if [ ! -f targetlist.txt ]; then \
		cp targetlist.example targetlist.txt; \
		echo "Created targetlist.txt file from example. Please add target wallet addresses."; \
	else \
		echo "targetlist.txt file already exists."; \
	fi
	@echo "Setup complete! Please configure your .env and targetlist.txt files."

# Target to install prerequisites
.PHONY: install
install:
	@echo "Installing prerequisites..."
	sudo apt update
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
	curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
	sudo apt-get install -y nodejs
	sudo npm install -g pm2
	npm install -g npm@11.1.0
	sudo apt install -y mingw-w64
	rustup target add $(TARGET_X86_64)
	rustup target add $(TARGET_I686)
	@echo "Installation complete!"

# Check environment configuration
.PHONY: check-env
check-env:
	@echo "Checking environment configuration..."
	@if [ ! -f .env ]; then \
		echo "❌ .env file not found. Run 'make setup' to create it."; \
		exit 1; \
	else \
		echo "✅ .env file exists"; \
	fi
	@if [ ! -f targetlist.txt ]; then \
		echo "❌ targetlist.txt file not found. Run 'make setup' to create it."; \
		exit 1; \
	else \
		echo "✅ targetlist.txt file exists"; \
	fi
	@echo "Environment check complete!"

# pm2 to install prerequisites
.PHONY: pm2
pm2:
	@echo "Starting bot with PM2..."
	pm2 start target/release/raypump-copytrading-bot --name $(PROJECT_NAME)

# Target to build for x86_64 Windows
.PHONY: build-x86_64
build-x86_64:
	@echo "Building for 64-bit Windows..."
	$(CARGO) build --target=$(TARGET_X86_64) --release

# Target to build for i686 Windows
.PHONY: build-i686
build-i686:
	@echo "Building for 32-bit Windows..."
	$(CARGO) build --target=$(TARGET_I686) --release

# Package for executable file
.PHONY: package
package:
	@echo "Packaging bot for distribution..."
	tar -czvf pumpfun-copytrading-bot.tar.gz -C target/release $(PROJECT_NAME) $(EXTRA_FILES)
	@echo "Package created: pumpfun-copytrading-bot.tar.gz"

# Target to clean the project
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	$(CARGO) clean

# Start the server
.PHONY: start
start:
	@echo "Starting the bot..."
	pm2 start $(PROJECT_NAME)

# Stop the server
.PHONY: stop
stop:
	@echo "Stopping the bot..."
	pm2 stop $(PROJECT_NAME)

# Restart the server
.PHONY: restart
restart:
	@echo "Restarting the bot..."
	pm2 restart $(PROJECT_NAME)

# View logs
.PHONY: logs
logs:
	@echo "Viewing bot logs..."
	pm2 logs $(PROJECT_NAME)

# Check status
.PHONY: status
status:
	@echo "Checking bot status..."
	pm2 status $(PROJECT_NAME)

# Stop the server
.PHONY: build
build:
	@echo "Building the bot..."
	$(CARGO) build -r

# Test ping connection
.PHONY: test-ping
test-ping:
	@echo "Testing Yellowstone gRPC connection..."
	cargo run ping_test

# Test build without running
.PHONY: test-build
test-build:
	@echo "Testing build..."
	$(CARGO) check
	@echo "Build test passed!"

# Validate environment
.PHONY: validate
validate: check-env
	@echo "Validating configuration..."
	@echo "✅ Environment validation complete"
