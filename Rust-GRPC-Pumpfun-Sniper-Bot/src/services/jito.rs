use anyhow::{anyhow, Result};
use indicatif::{ProgressBar, ProgressStyle};
use rand::{seq::IteratorRandom, thread_rng};
use serde::Deserialize;
use serde_json::Value;
use anchor_client::solana_sdk::pubkey::Pubkey;
use std::{future::Future, str::FromStr, sync::LazyLock, time::Duration};
use tokio::time::{sleep, Instant};

use crate::common::config::import_env_var;

pub static BLOCK_ENGINE_URL: LazyLock<String> =
    LazyLock::new(|| import_env_var("JITO_BLOCK_ENGINE_URL"));

pub fn get_tip_account() -> Result<(Pubkey, Pubkey)> {
    let accounts = [
        "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5".to_string(),
        "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt".to_string(),
        "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL".to_string(),
        "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT".to_string(),
        "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe".to_string(),
        "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh".to_string(),
        "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49".to_string(),
        "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY".to_string(),
    ];
    let mut rng = thread_rng();
    let tip_account = match accounts.iter().choose(&mut rng) {
        Some(acc) => Ok(Pubkey::from_str(acc).inspect_err(|err| {
            println!("jito: failed to parse Pubkey: {:?}", err);
        })?),
        None => Err(anyhow!("jito: no tip accounts available")),
    };
    let tip1_account = Pubkey::from_str("JitoFSvbiCrygnx4HZzau4LdeyBU6VUeyf9jt8F8bMk")
        .inspect_err(|err| {
            println!("jito: failed to parse Pubkey: {:?}", err);
        })?;
    let tip_account = tip_account?;
    Ok((tip_account, tip1_account))
}
#[derive(Deserialize, Debug)]
pub struct BundleStatus {
    pub bundle_id: String,
    pub transactions: Vec<String>,
    pub slot: u64,
    pub confirmation_status: String,
    pub err: ErrorStatus,
}
#[derive(Deserialize, Debug)]
pub struct ErrorStatus {
    #[serde(rename = "Ok")]
    pub ok: Option<()>,
}

use crate::error::ClientError;
use bincode;
use bs64;
use reqwest;
use serde_json::json;
use anchor_client::solana_sdk::{
    commitment_config::CommitmentConfig, signature::Signature, transaction::Transaction,
};

pub const MAX_RETRIES: u8 = 3;
pub const RETRY_DELAY: Duration = Duration::from_millis(200);

#[derive(Debug, Clone)]
pub struct TransactionConfig {
    pub skip_preflight: bool,
    pub preflight_commitment: CommitmentConfig,
    pub encoding: String,
    pub last_n_blocks: u64,
}

impl Default for TransactionConfig {
    fn default() -> Self {
        Self {
            skip_preflight: true,
            preflight_commitment: CommitmentConfig::confirmed(),
            encoding: "base64".to_string(),
            last_n_blocks: 100,
        }
    }
}

#[derive(Clone, Debug)]
pub struct JitoClient {
    endpoint: String,
    client: reqwest::Client,
    config: TransactionConfig,
}
