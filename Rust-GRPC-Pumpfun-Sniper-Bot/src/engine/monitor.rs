use anchor_client::solana_sdk::{hash::Hash, pubkey::Pubkey, signature::Signature};
use borsh::from_slice;
use maplit::hashmap;
use spl_token::solana_program::native_token::{lamports_to_sol, LAMPORTS_PER_SOL};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::{collections::HashSet, time::Duration};
use tokio::process::Command;

use super::swap::{SwapDirection, SwapInType};
use crate::common::config::{JUPITER_PROGRAM, OKX_DEX_PROGRAM, PROGRAM_DATA_PREFIX};
use crate::common::{
    config::{AppState, LiquidityPool, Status, SwapConfig, PUMP_LOG_INSTRUCTION},
    logger::Logger,
};
use crate::core::tx;
use crate::dex::pump_fun::{
    Pump, INITIAL_VIRTUAL_SOL_RESERVES, INITIAL_VIRTUAL_TOKEN_RESERVES,
    PUMP_FUN_CREATE_IX_DISCRIMINATOR, PUMP_PROGRAM,
};
use anyhow::{anyhow, Result};
use chrono::Utc;
use colored::Colorize;
use futures_util::stream::StreamExt;
use futures_util::SinkExt;
use std::str::FromStr;
use tokio::{
    task,
    time::{self, Instant},
};
use yellowstone_grpc_client::{ClientTlsConfig, GeyserGrpcClient};
use yellowstone_grpc_proto::geyser::{
    subscribe_update::UpdateOneof, CommitmentLevel, SubscribeRequest,
    SubscribeRequestFilterTransactions, SubscribeUpdateTransaction,
};

#[derive(Clone, Debug)]
pub struct BondingCurveInfo {
    pub bonding_curve: Pubkey,
    pub new_virtual_sol_reserve: u64,
    pub new_virtual_token_reserve: u64,
}

#[derive(Clone, Debug)]
pub struct TokenMonitor {
    pub app_state: Arc<Mutex<AppState>>,
    pub swap_config: Arc<Mutex<SwapConfig>>,
    pub min_dev_buy: u64,
    pub max_dev_buy: u64,
    pub take_profit: f64,
    pub stop_loss: f64,
    pub active_tokens: Arc<Mutex<HashMap<String, LiquidityPool>>>,
    pub processed_transactions: Arc<Mutex<HashSet<Signature>>>,
}

impl TokenMonitor {
    pub fn new(
        app_state: Arc<Mutex<AppState>>,
        swap_config: Arc<Mutex<SwapConfig>>,
        min_dev_buy: u64,
        max_dev_buy: u64,
        take_profit: f64,
        stop_loss: f64,
    ) -> Self {
        Self {
            app_state,
            swap_config,
            min_dev_buy,
            max_dev_buy,
            take_profit,
            stop_loss,
            active_tokens: Arc::new(Mutex::new(HashMap::new())),
            processed_transactions: Arc::new(Mutex::new(HashSet::new())),
        }
    }

    pub async fn start_monitoring(
        &self,
        yellowstone_grpc_http: String,
        yellowstone_grpc_token: String,
    ) -> Result<()> {
        println!("🚀 Starting Pump.fun token monitoring...");
        
        // Create gRPC client
        let client = self.create_grpc_client(&yellowstone_grpc_http, &yellowstone_grpc_token).await?;
        
        // Subscribe to transaction updates
        let mut stream = self.subscribe_to_transactions(&client).await?;
        
        println!("✅ Successfully connected to Yellowstone gRPC");
        println!("📡 Monitoring for new token launches...");
        
        // Process incoming transaction updates
        while let Some(update) = stream.next().await {
            match update {
                Ok(update) => {
                    if let Some(transaction) = update.transaction {
                        self.process_transaction_update(transaction).await?;
                    }
                }
                Err(e) => {
                    eprintln!("❌ Error receiving update: {}", e);
                    continue;
                }
            }
        }
        
        Ok(())
    }

    async fn create_grpc_client(
        &self,
        http_url: &str,
        token: &str,
    ) -> Result<GeyserGrpcClient> {
        let tls_config = ClientTlsConfig::new();
        
        let client = GeyserGrpcClient::connect(
            http_url,
            Some(token.to_string()),
            tls_config,
        )
        .await
        .map_err(|e| anyhow!("Failed to connect to gRPC: {}", e))?;
        
        Ok(client)
    }

    async fn subscribe_to_transactions(
        &self,
        client: &GeyserGrpcClient,
    ) -> Result<impl StreamExt<Item = Result<_, _>>> {
        let filter = SubscribeRequestFilterTransactions {
            vote: false,
            failed: false,
            signature: false,
            account_include: vec![],
            account_exclude: vec![],
            account_required: vec![],
        };

        let request = SubscribeRequest {
            accounts: vec![],
            blocks: vec![],
            blocks_meta: vec![],
            entry: vec![],
            commitment: CommitmentLevel::Confirmed.into(),
            accounts_data_slice: vec![],
            transactions: Some(filter),
            blocks_with_config: vec![],
            accounts_with_config: vec![],
            transactions_with_config: vec![],
        };

        let stream = client
            .subscribe_once(request)
            .await
            .map_err(|e| anyhow!("Failed to subscribe: {}", e))?;

        Ok(stream)
    }

    async fn process_transaction_update(
        &self,
        transaction: SubscribeUpdateTransaction,
    ) -> Result<()> {
        let signature = transaction.signature;
        
        // Check if we've already processed this transaction
        {
            let mut processed = self.processed_transactions.lock().unwrap();
            if processed.contains(&signature) {
                return Ok(());
            }
            processed.insert(signature.clone());
        }

        // Check if this is a Pump.fun token creation transaction
        if let Some(meta) = transaction.meta {
            if let Some(log_messages) = meta.log_messages {
                for log in log_messages {
                    if log.contains("Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke") {
                        // This is a Pump.fun transaction
                        if let Some(accounts) = transaction.transaction {
                            self.analyze_pump_fun_transaction(accounts, &signature).await?;
                        }
                        break;
                    }
                }
            }
        }

        Ok(())
    }

    async fn analyze_pump_fun_transaction(
        &self,
        accounts: Vec<Pubkey>,
        signature: &Signature,
    ) -> Result<()> {
        // Look for token mint account
        for account in accounts {
            // Check if this account is a token mint
            if let Ok(mint_info) = self.get_mint_info(account).await {
                println!("🔍 New token detected: {}", account);
                
                // Create liquidity pool entry
                let liquidity_pool = LiquidityPool {
                    mint: account.to_string(),
                    dev: "".to_string(), // Will be filled when dev sells
                    buy_price: 0.0,
                    sell_price: 0.0,
                    peak_price: 0.0,
                    status: Status::New,
                    timestamp: Some(Instant::now()),
                };

                // Add to active tokens
                {
                    let mut active_tokens = self.active_tokens.lock().unwrap();
                    active_tokens.insert(account.to_string(), liquidity_pool);
                }

                // Start monitoring this token
                self.start_token_monitoring(account).await?;
            }
        }

        Ok(())
    }

    async fn get_mint_info(&self, pubkey: Pubkey) -> Result<()> {
        // This is a simplified check - in a real implementation,
        // you would verify this is actually a token mint account
        // by checking the account data and owner
        Ok(())
    }

    async fn start_token_monitoring(&self, mint: Pubkey) -> Result<()> {
        let mint_str = mint.to_string();
        println!("📊 Starting monitoring for token: {}", mint_str);
        
        // Spawn a task to monitor this specific token
        let monitor = self.clone();
        let mint_clone = mint.clone();
        
        task::spawn(async move {
            if let Err(e) = monitor.monitor_token(mint_clone).await {
                eprintln!("❌ Error monitoring token {}: {}", mint_str, e);
            }
        });

        Ok(())
    }

    async fn monitor_token(&self, mint: Pubkey) -> Result<()> {
        let mint_str = mint.to_string();
        let mut last_check = Instant::now();
        
        loop {
            time::sleep(Duration::from_millis(1000)).await; // Check every second
            
            // Get current token price and volume
            if let Some(bonding_curve_info) = self.get_bonding_curve_info(&mint).await? {
                let current_price = self.calculate_token_price(&bonding_curve_info);
                
                // Update liquidity pool
                self.update_liquidity_pool(&mint_str, current_price).await?;
                
                // Check if we should buy
                if self.should_buy_token(&mint_str, current_price).await? {
                    self.execute_buy_order(&mint, current_price).await?;
                }
                
                // Check if we should sell
                if self.should_sell_token(&mint_str, current_price).await? {
                    self.execute_sell_order(&mint, current_price).await?;
                }
            }
            
            // Check if we should stop monitoring this token
            if self.should_stop_monitoring(&mint_str).await? {
                println!("🛑 Stopping monitoring for token: {}", mint_str);
                break;
            }
            
            last_check = Instant::now();
        }
        
        Ok(())
    }

    async fn get_bonding_curve_info(&self, mint: &Pubkey) -> Result<Option<BondingCurveInfo>> {
        // In a real implementation, you would fetch the bonding curve account data
        // and deserialize it to get the virtual reserves
        // For now, return None to indicate no data available
        Ok(None)
    }

    fn calculate_token_price(&self, bonding_curve_info: &BondingCurveInfo) -> f64 {
        let sol_reserve = bonding_curve_info.new_virtual_sol_reserve as f64;
        let token_reserve = bonding_curve_info.new_virtual_token_reserve as f64;
        
        if token_reserve > 0.0 {
            sol_reserve / token_reserve
        } else {
            0.0
        }
    }

    async fn update_liquidity_pool(&self, mint: &str, current_price: f64) -> Result<()> {
        let mut active_tokens = self.active_tokens.lock().unwrap();
        
        if let Some(pool) = active_tokens.get_mut(mint) {
            if current_price > pool.peak_price {
                pool.peak_price = current_price;
            }
            
            // Update status based on price movement
            if pool.status == Status::New && current_price > 0.0 {
                pool.status = Status::Checking;
            }
        }
        
        Ok(())
    }

    async fn should_buy_token(&self, mint: &str, current_price: f64) -> Result<bool> {
        let active_tokens = self.active_tokens.lock().unwrap();
        
        if let Some(pool) = active_tokens.get(mint) {
            // Check if token is in checking status and meets our criteria
            if pool.status == Status::Checking {
                // Add your buying logic here
                // For example: check volume, price movement, etc.
                return Ok(false); // Placeholder
            }
        }
        
        Ok(false)
    }

    async fn should_sell_token(&self, mint: &str, current_price: f64) -> Result<bool> {
        let active_tokens = self.active_tokens.lock().unwrap();
        
        if let Some(pool) = active_tokens.get(mint) {
            if pool.status == Status::Bought {
                // Check take profit and stop loss
                if pool.buy_price > 0.0 {
                    let profit_ratio = current_price / pool.buy_price;
                    
                    if profit_ratio >= self.take_profit || profit_ratio <= self.stop_loss {
                        return Ok(true);
                    }
                }
            }
        }
        
        Ok(false)
    }

    async fn should_stop_monitoring(&self, mint: &str) -> Result<bool> {
        let active_tokens = self.active_tokens.lock().unwrap();
        
        if let Some(pool) = active_tokens.get(mint) {
            match pool.status {
                Status::Sold | Status::Failure => return Ok(true),
                _ => {}
            }
        }
        
        Ok(false)
    }

    async fn execute_buy_order(&self, mint: &Pubkey, price: f64) -> Result<()> {
        println!("💰 Executing buy order for token: {} at price: {}", mint, price);
        
        // Update status to Buying
        {
            let mut active_tokens = self.active_tokens.lock().unwrap();
            if let Some(pool) = active_tokens.get_mut(&mint.to_string()) {
                pool.status = Status::Buying;
                pool.buy_price = price;
            }
        }
        
        // Here you would implement the actual buy logic
        // using the swap engine and DEX integration
        
        // For now, just update status
        {
            let mut active_tokens = self.active_tokens.lock().unwrap();
            if let Some(pool) = active_tokens.get_mut(&mint.to_string()) {
                pool.status = Status::Bought;
            }
        }
        
        println!("✅ Buy order completed for token: {}", mint);
        Ok(())
    }

    async fn execute_sell_order(&self, mint: &Pubkey, price: f64) -> Result<()> {
        println!("💸 Executing sell order for token: {} at price: {}", mint, price);
        
        // Update status to Selling
        {
            let mut active_tokens = self.active_tokens.lock().unwrap();
            if let Some(pool) = active_tokens.get_mut(&mint.to_string()) {
                pool.status = Status::Selling;
                pool.sell_price = price;
            }
        }
        
        // Here you would implement the actual sell logic
        // using the swap engine and DEX integration
        
        // For now, just update status
        {
            let mut active_tokens = self.active_tokens.lock().unwrap();
            if let Some(pool) = active_tokens.get_mut(&mint.to_string()) {
                pool.status = Status::Sold;
            }
        }
        
        println!("✅ Sell order completed for token: {}", mint);
        Ok(())
    }
}

impl Clone for TokenMonitor {
    fn clone(&self) -> Self {
        Self {
            app_state: self.app_state.clone(),
            swap_config: self.swap_config.clone(),
            min_dev_buy: self.min_dev_buy,
            max_dev_buy: self.max_dev_buy,
            take_profit: self.take_profit,
            stop_loss: self.stop_loss,
            active_tokens: self.active_tokens.clone(),
            processed_transactions: self.processed_transactions.clone(),
        }
    }
}

/// Main function to start the Pump.fun token trader
pub async fn new_token_trader_pumpfun(
    yellowstone_grpc_http: String,
    yellowstone_grpc_token: String,
    app_state: Arc<Mutex<AppState>>,
    swap_config: Arc<Mutex<SwapConfig>>,
    min_dev_buy: u64,
    max_dev_buy: u64,
    take_profit: f64,
    stop_loss: f64,
) -> Result<()> {
    println!("🚀 Initializing Pump.fun Token Trader...");
    println!("📊 Configuration:");
    println!("   Min Dev Buy: {} SOL", lamports_to_sol(min_dev_buy));
    println!("   Max Dev Buy: {} SOL", lamports_to_sol(max_dev_buy));
    println!("   Take Profit: {}x", take_profit);
    println!("   Stop Loss: {}x", stop_loss);
    
    // Create token monitor
    let monitor = TokenMonitor::new(
        app_state,
        swap_config,
        min_dev_buy,
        max_dev_buy,
        take_profit,
        stop_loss,
    );
    
    // Start monitoring
    monitor.start_monitoring(yellowstone_grpc_http, yellowstone_grpc_token).await?;
    
    Ok(())
}

/// Utility function to get current SOL price in USD
pub async fn get_sol_price() -> Result<f64> {
    // In a real implementation, you would fetch this from CoinGecko or similar
    // For now, return a placeholder value
    Ok(100.0)
}

/// Utility function to calculate optimal buy amount based on dev buy
pub fn calculate_buy_amount(dev_buy_amount: u64, min_dev_buy: u64, max_dev_buy: u64) -> u64 {
    if dev_buy_amount < min_dev_buy {
        return 0; // Dev buy too small
    }
    
    if dev_buy_amount > max_dev_buy {
        return max_dev_buy; // Cap at maximum
    }
    
    // Calculate proportional buy amount
    let ratio = dev_buy_amount as f64 / max_dev_buy as f64;
    (ratio * max_dev_buy as f64) as u64
}

/// Utility function to check if a transaction is a Pump.fun token creation
pub fn is_pump_fun_token_creation(log_messages: &[String]) -> bool {
    for log in log_messages {
        if log.contains("Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke") {
            return true;
        }
    }
    false
}

/// Utility function to extract token mint from transaction logs
pub fn extract_token_mint_from_logs(log_messages: &[String]) -> Option<Pubkey> {
    // This is a simplified implementation
    // In a real scenario, you would parse the logs more carefully
    for log in log_messages {
        if log.contains("Created account") {
            // Extract the account address from the log
            // This is a placeholder - actual implementation would be more complex
            return None;
        }
    }
    None
}
