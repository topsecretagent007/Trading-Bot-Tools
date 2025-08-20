use crate::error::ClientError;
use anyhow::{anyhow, Result};
use rand::{seq::IteratorRandom, thread_rng};
use serde_json::{json, Value};
use anchor_client::solana_sdk::{pubkey::Pubkey, signature::Signature, transaction::Transaction};
use std::{str::FromStr, sync::LazyLock};

use crate::common::config::import_env_var;

pub static ZERO_SLOT_URL: LazyLock<String> = LazyLock::new(|| import_env_var("ZERO_SLOT_URL"));

pub fn get_tip_account() -> Result<Pubkey> {
    let accounts = [
        "6fQaVhYZA4w3MBSXjJ81Vf6W1EDYeUPXpgVQ6UQyU1Av".to_string(),
        "4HiwLEP2Bzqj3hM2ENxJuzhcPCdsafwiet3oGkMkuQY4".to_string(),
        "7toBU3inhmrARGngC7z6SjyP85HgGMmCTEwGNRAcYnEK".to_string(),
        "8mR3wB1nh4D6J9RUCugxUpc6ya8w38LPxZ3ZjcBhgzws".to_string(),
        "6SiVU5WEwqfFapRuYCndomztEwDjvS5xgtEof3PLEGm9".to_string(),
        "TpdxgNJBWZRL8UXF5mrEsyWxDWx9HQexA9P1eTWQ42p".to_string(),
        "D8f3WkQu6dCF33cZxuAsrKHrGsqGP2yvAHf8mX6RXnwf".to_string(),
        "GQPFicsy3P3NXxB5piJohoxACqTvWE9fKpLgdsMduoHE".to_string(),
        "Ey2JEr8hDkgN8qKJGrLf2yFjRhW7rab99HVxwi5rcvJE".to_string(),
        "4iUgjMT8q2hNZnLuhpqZ1QtiV8deFPy2ajvvjEpKKgsS".to_string(),
        "3Rz8uD83QsU8wKvZbgWAPvCNDU6Fy8TSZTMcPm3RB6zt".to_string(),
        "DiTmWENJsHQdawVUUKnUXkconcpW4Jv52TnMWhkncF6t".to_string(),
        "HRyRhQ86t3H4aAtgvHVpUJmw64BDrb61gRiKcdKUXs5c".to_string(),
        "7y4whZmw388w1ggjToDLSBLv47drw5SUXcLk6jtmwixd".to_string(),
        "J9BMEWFbCBEjtQ1fG5Lo9kouX1HfrKQxeUxetwXrifBw".to_string(),
        "8U1JPQh3mVQ4F5jwRdFTBzvNRQaYFQppHQYoH38DJGSQ".to_string(),
        "Eb2KpSC8uMt9GmzyAEm5Eb1AAAgTjRaXWFjKyFXHZxF3".to_string(),
        "FCjUJZ1qozm1e8romw216qyfQMaaWKxWsuySnumVCCNe".to_string(),
        "ENxTEjSQ1YabmUpXAdCgevnHQ9MHdLv8tzFiuiYJqa13".to_string(),
        "6rYLG55Q9RpsPGvqdPNJs4z5WTxJVatMB8zV3WJhs5EK".to_string(),
        "Cix2bHfqPcKcM233mzxbLk14kSggUUiz2A87fJtGivXr".to_string(),
    ];
    let mut rng = thread_rng();
    let tip_account = match accounts.iter().choose(&mut rng) {
        Some(acc) => Ok(Pubkey::from_str(acc).inspect_err(|err| {
            println!("zeroslot: failed to parse Pubkey: {:?}", err);
        })?),
        None => Err(anyhow!("zeroslot: no tip accounts available")),
    };

    let tip_account = tip_account?;
    Ok(tip_account)
}

pub const MAX_RETRIES: u8 = 3;

#[derive(Debug, Clone)]
pub struct TransactionConfig {
    pub skip_preflight: bool,
    pub encoding: String,
    pub last_n_blocks: u64,
    pub preflight_commitment: CommitmentConfig
}

