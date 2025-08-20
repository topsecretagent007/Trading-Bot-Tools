use anyhow::Result;
use bs58;
use colored::Colorize;
use dotenv::dotenv;
use reqwest::Error;
use serde::Deserialize;
use anchor_client::solana_sdk::{commitment_config::CommitmentConfig, signature::Keypair, signer::Signer};
use tokio::sync::{Mutex, OnceCell};
use std::{env, sync::Arc, hash::{Hash, Hasher}};

use crate::{
    common::{constants::INIT_MSG, logger::Logger},
    engine::swap::{SwapDirection, SwapInType},
};

static GLOBAL_CONFIG: OnceCell<Mutex<Config>> = OnceCell::const_new();

// Constants
pub const JUPITER_PROGRAM: &str = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
pub const OKX_DEX_PROGRAM: &str = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
pub const PROGRAM_DATA_PREFIX: &str = "ProgramData";
pub const PUMP_LOG_INSTRUCTION: &str = "PumpFunInstruction";

pub struct Config {
    pub yellowstone_grpc_http: String,
    pub yellowstone_grpc_token: String,
    pub app_state: AppState,
    pub swap_config: SwapConfig,
    pub min_dev_buy: u32,
    pub max_dev_buy: u32,
    pub take_profit: f64,
    pub stop_loss: f64
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub wallet_keypair: Keypair,
    pub rpc_url: String,
    pub ws_url: String,
    pub commitment: CommitmentConfig,
}

impl AppState {
    pub fn new() -> Result<Self> {
        dotenv().ok();
        
        let wallet_private_key = env::var("WALLET_PRIVATE_KEY")
            .expect("WALLET_PRIVATE_KEY must be set");
        let wallet_keypair = bs58::decode(wallet_private_key)
            .into_vec()
            .map_err(|e| anyhow::anyhow!("Failed to decode wallet private key: {}", e))?;
        let wallet_keypair = Keypair::from_bytes(&wallet_keypair)
            .map_err(|e| anyhow::anyhow!("Failed to create keypair: {}", e))?;
        
        let rpc_url = env::var("RPC_URL")
            .unwrap_or_else(|_| "https://api.mainnet-beta.solana.com".to_string());
        let ws_url = env::var("WS_URL")
            .unwrap_or_else(|_| "wss://api.mainnet-beta.solana.com".to_string());
        
        Ok(Self {
            wallet_keypair,
            rpc_url,
            ws_url,
            commitment: CommitmentConfig::confirmed(),
        })
    }
}

#[derive(Debug, Clone)]
pub struct SwapConfig {
    pub slippage: u32,
    pub token_amount: f64,
    pub jito_tip_value: f64,
    pub jito_priority_fee: u64,
}

impl SwapConfig {
    pub fn new() -> Result<Self> {
        dotenv().ok();
        
        let slippage = env::var("SLIPPAGE")
            .unwrap_or_else(|_| "50".to_string())
            .parse::<u32>()
            .unwrap_or(50);
        
        let token_amount = env::var("TOKEN_AMOUNT")
            .unwrap_or_else(|_| "0.001".to_string())
            .parse::<f64>()
            .unwrap_or(0.001);
        
        let jito_tip_value = env::var("JITO_TIP_VALUE")
            .unwrap_or_else(|_| "0.001".to_string())
            .parse::<f64>()
            .unwrap_or(0.001);
        
        let jito_priority_fee = env::var("JITO_PRIORITY_FEE")
            .unwrap_or_else(|_| "1000".to_string())
            .parse::<u64>()
            .unwrap_or(1000);
        
        Ok(Self {
            slippage,
            token_amount,
            jito_tip_value,
            jito_priority_fee,
        })
    }
}

#[derive(Debug, PartialEq, Clone)]
pub struct LiquidityPool {
    pub mint: String,
    pub dev: String,
    pub buy_price: f64,
    pub sell_price: f64,
    pub peak_price: f64,
    pub status: Status,
    pub timestamp: Option<tokio::time::Instant>,
}

impl Eq for LiquidityPool {}
impl Hash for LiquidityPool {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.mint.hash(state);
        self.buy_price.to_bits().hash(state); // Convert f64 to bits for hashing
        self.sell_price.to_bits().hash(state);
        self.status.hash(state);
    }
}

#[derive(Debug, Clone, Hash, PartialEq, Eq)]
pub enum Status {
    New,
    DevSold,
    Bought,
    Buying,
    Checking,
    Sold,
    Selling,
    Failure,
}

#[derive(Deserialize)]
struct CoinGeckoResponse {
    solana: SolanaData,
}

#[derive(Deserialize)]
struct SolanaData {
    usd: f64,
}

impl Config {
    pub async fn new() -> Arc<Mutex<Self>> {
        if let Some(config) = GLOBAL_CONFIG.get() {
            return config.clone();
        }

        dotenv().ok();
        
        let yellowstone_grpc_http = env::var("YELLOWSTONE_GRPC_HTTP")
            .expect("YELLOWSTONE_GRPC_HTTP must be set");
        let yellowstone_grpc_token = env::var("YELLOWSTONE_GRPC_TOKEN")
            .expect("YELLOWSTONE_GRPC_TOKEN must be set");
        
        let app_state = AppState::new()
            .expect("Failed to create AppState");
        let swap_config = SwapConfig::new()
            .expect("Failed to create SwapConfig");
        
        let min_dev_buy = env::var("MIN_DEV_BUY")
            .unwrap_or_else(|_| "1000".to_string())
            .parse::<u32>()
            .unwrap_or(1000);
        
        let max_dev_buy = env::var("MAX_DEV_BUY")
            .unwrap_or_else(|_| "10000".to_string())
            .parse::<u32>()
            .unwrap_or(10000);
        
        let take_profit = env::var("TP")
            .unwrap_or_else(|_| "2.0".to_string())
            .parse::<f64>()
            .unwrap_or(2.0);
        
        let stop_loss = env::var("SL")
            .unwrap_or_else(|_| "0.5".to_string())
            .parse::<f64>()
            .unwrap_or(0.5);
        
        let config = Self {
            yellowstone_grpc_http,
            yellowstone_grpc_token,
            app_state,
            swap_config,
            min_dev_buy,
            max_dev_buy,
            take_profit,
            stop_loss,
        };
        
        let config = Arc::new(Mutex::new(config));
        let _ = GLOBAL_CONFIG.set(config.clone());
        
        config
    }
}

pub fn create_nonblocking_rpc_client(rpc_url: &str) -> anchor_client::solana_client::nonblocking::rpc_client::RpcClient {
    anchor_client::solana_client::nonblocking::rpc_client::RpcClient::new(rpc_url.to_string())
}

pub fn import_env_var(key: &str) -> String {
    env::var(key).unwrap_or_else(|_| {
        eprintln!("Warning: {} not set, using default value", key);
        "".to_string()
    })
}
