#!/usr/bin/env node

/**
 * Solana Arbitrage Bot Monitor
 * Real-time monitoring and analytics for the arbitrage bot
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

class ArbitrageMonitor {
    constructor() {
        this.stats = {
            startTime: new Date(),
            totalTransactions: 0,
            successfulTransactions: 0,
            failedTransactions: 0,
            totalProfit: 0,
            averageProfit: 0,
            lastTransaction: null,
            uptime: 0
        };
        
        this.logFile = 'log.txt';
        this.configFile = '../config.json';
        this.isRunning = false;
    }

    /**
     * Initialize the monitor
     */
    async init() {
        console.log(`${colors.cyan}🔍 Solana Arbitrage Bot Monitor${colors.reset}`);
        console.log(`${colors.blue}================================${colors.reset}\n`);
        
        // Load configuration
        await this.loadConfig();
        
        // Start monitoring
        this.startMonitoring();
        
        // Set up graceful shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    /**
     * Load configuration from config.json
     */
    async loadConfig() {
        try {
            const configPath = path.join(__dirname, this.configFile);
            const configData = fs.readFileSync(configPath, 'utf8');
            this.config = JSON.parse(configData);
            console.log(`${colors.green}✅ Configuration loaded${colors.reset}`);
        } catch (error) {
            console.log(`${colors.yellow}⚠️  Using default configuration${colors.reset}`);
            this.config = {
                monitoring: {
                    log_level: 'info',
                    log_file: 'log.txt',
                    metrics_enabled: true
                }
            };
        }
    }

    /**
     * Start monitoring the log file
     */
    startMonitoring() {
        console.log(`${colors.blue}📊 Starting real-time monitoring...${colors.reset}\n`);
        
        this.isRunning = true;
        
        // Watch the log file for changes
        this.watchLogFile();
        
        // Update statistics every 5 seconds
        setInterval(() => {
            this.updateStats();
            this.displayStats();
        }, 5000);
        
        // Display initial stats
        this.displayStats();
    }

    /**
     * Watch the log file for new entries
     */
    watchLogFile() {
        const logPath = path.join(__dirname, '..', this.logFile);
        
        // Check if log file exists
        if (!fs.existsSync(logPath)) {
            console.log(`${colors.yellow}⚠️  Log file not found: ${logPath}${colors.reset}`);
            console.log(`${colors.blue}📝 Waiting for bot to start...${colors.reset}\n`);
            return;
        }

        // Create file watcher
        const watcher = fs.watch(logPath, (eventType, filename) => {
            if (eventType === 'change') {
                this.parseLogFile();
            }
        });

        // Initial parse
        this.parseLogFile();
    }

    /**
     * Parse the log file for transaction data
     */
    parseLogFile() {
        try {
            const logPath = path.join(__dirname, '..', this.logFile);
            const logContent = fs.readFileSync(logPath, 'utf8');
            const lines = logContent.split('\n');
            
            // Parse recent lines for transaction data
            const recentLines = lines.slice(-100); // Last 100 lines
            
            recentLines.forEach(line => {
                this.parseLogLine(line);
            });
        } catch (error) {
            // Log file might not exist yet
        }
    }

    /**
     * Parse a single log line for transaction information
     */
    parseLogLine(line) {
        // Look for arbitrage detection patterns
        if (line.includes('found arbitrage:')) {
            this.stats.totalTransactions++;
            this.stats.lastTransaction = new Date();
            
            // Extract profit information
            const profitMatch = line.match(/found arbitrage: (\d+) -> (\d+)/);
            if (profitMatch) {
                const initialBalance = parseInt(profitMatch[1]);
                const finalBalance = parseInt(profitMatch[2]);
                const profit = finalBalance - initialBalance;
                
                if (profit > 0) {
                    this.stats.successfulTransactions++;
                    this.stats.totalProfit += profit;
                    this.stats.averageProfit = this.stats.totalProfit / this.stats.successfulTransactions;
                } else {
                    this.stats.failedTransactions++;
                }
            }
        }
        
        // Look for transaction success/failure patterns
        if (line.includes('success!')) {
            this.stats.successfulTransactions++;
        } else if (line.includes('failed') || line.includes('error')) {
            this.stats.failedTransactions++;
        }
    }

    /**
     * Update statistics
     */
    updateStats() {
        this.stats.uptime = Date.now() - this.stats.startTime.getTime();
    }

    /**
     * Display current statistics
     */
    displayStats() {
        // Clear console
        console.clear();
        
        console.log(`${colors.cyan}🔍 Solana Arbitrage Bot Monitor${colors.reset}`);
        console.log(`${colors.blue}================================${colors.reset}\n`);
        
        // Uptime
        const uptime = this.formatUptime(this.stats.uptime);
        console.log(`${colors.white}⏱️  Uptime: ${colors.cyan}${uptime}${colors.reset}`);
        
        // Transaction statistics
        console.log(`\n${colors.white}📊 Transaction Statistics:${colors.reset}`);
        console.log(`   Total Transactions: ${colors.cyan}${this.stats.totalTransactions}${colors.reset}`);
        console.log(`   Successful: ${colors.green}${this.stats.successfulTransactions}${colors.reset}`);
        console.log(`   Failed: ${colors.red}${this.stats.failedTransactions}${colors.reset}`);
        
        if (this.stats.totalTransactions > 0) {
            const successRate = ((this.stats.successfulTransactions / this.stats.totalTransactions) * 100).toFixed(2);
            console.log(`   Success Rate: ${colors.cyan}${successRate}%${colors.reset}`);
        }
        
        // Profit statistics
        console.log(`\n${colors.white}💰 Profit Statistics:${colors.reset}`);
        console.log(`   Total Profit: ${colors.green}${this.formatNumber(this.stats.totalProfit)}${colors.reset}`);
        console.log(`   Average Profit: ${colors.cyan}${this.formatNumber(this.stats.averageProfit)}${colors.reset}`);
        
        // Last transaction
        if (this.stats.lastTransaction) {
            const timeSince = Date.now() - this.stats.lastTransaction.getTime();
            const timeAgo = this.formatTimeAgo(timeSince);
            console.log(`   Last Transaction: ${colors.yellow}${timeAgo} ago${colors.reset}`);
        }
        
        // Performance metrics
        console.log(`\n${colors.white}⚡ Performance Metrics:${colors.reset}`);
        if (this.stats.uptime > 0) {
            const txPerHour = (this.stats.totalTransactions / (this.stats.uptime / 3600000)).toFixed(2);
            console.log(`   Transactions/Hour: ${colors.cyan}${txPerHour}${colors.reset}`);
        }
        
        // Status indicator
        const status = this.isRunning ? `${colors.green}🟢 Running${colors.reset}` : `${colors.red}🔴 Stopped${colors.reset}`;
        console.log(`\n${colors.white}Status: ${status}${colors.reset}`);
        
        console.log(`\n${colors.blue}Press Ctrl+C to exit${colors.reset}`);
    }

    /**
     * Format uptime in human readable format
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Format time ago
     */
    formatTimeAgo(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return `${seconds}s ago`;
        }
    }

    /**
     * Format large numbers with commas
     */
    formatNumber(num) {
        return num.toLocaleString();
    }

    /**
     * Graceful shutdown
     */
    shutdown() {
        console.log(`\n${colors.yellow}🛑 Shutting down monitor...${colors.reset}`);
        this.isRunning = false;
        process.exit(0);
    }
}

// Start the monitor
const monitor = new ArbitrageMonitor();
monitor.init().catch(error => {
    console.error(`${colors.red}❌ Error starting monitor: ${error.message}${colors.reset}`);
    process.exit(1);
}); 