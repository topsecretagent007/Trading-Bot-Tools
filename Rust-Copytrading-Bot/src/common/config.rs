use anyhow::Result;
use colored::Colorize;
use dotenv::dotenv;
use reqwest::Error;
use serde::Deserialize;
use solana_sdk::{bs58, commitment_config::CommitmentConfig, signature::Keypair, signer::Signer};
use std::{
    env,
    hash::{Hash, Hasher},
    sync::Arc,
};

use crate::{
    common::{constants::INIT_MSG, logger::Logger},
    engine::swap::{SwapDirection, SwapInType},
};

pub struct Config {
    pub yellowstone_grpc_http: String,
    pub yellowstone_grpc_token: String,
    pub app_state: AppState,
    pub buy_token_percent: f64,
    pub sell_token_percent: f64,
    pub targetlist: Targetlist,
    pub take_profit: f64,
    pub market_cap: f64,
    pub stop_loss: f64,
    pub slippage: u64,
}

impl Config {
    pub async fn new() -> Self {
        let init_msg = INIT_MSG;
        println!("{}", init_msg);

    }
}

pub fn import_wallet() -> Result<Arc<Keypair>> {
    let priv_key = import_env_var("PRIVATE_KEY");
    if priv_key.len() < 85 {
        println!("{}", format!("Please check wallet priv key: Invalid length => {}", priv_key.len()).red().to_string());
        loop{}
    }
    let wallet: Keypair = Keypair::from_base58_string(priv_key.as_str());

    Ok(Arc::new(wallet))
}
