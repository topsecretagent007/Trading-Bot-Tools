use anyhow::Result;
use colored::Colorize;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    instruction::Instruction, signature::Keypair, signer::Signer, system_instruction,
    transaction::Transaction,
};
use spl_token::ui_amount_to_amount;
use std::sync::Arc;
use tokio::time::Instant;

use crate::{
    common::logger::Logger,
    services::{
        jito::{self, get_tip_account, get_tip_value, wait_for_bundle_confirmation, JitoClient},
        nozomi::{self, TemporalClient},
    },
};

pub async fn new_signed_and_send(
    recent_blockhash: solana_sdk::hash::Hash,
    keypair: &Keypair,
    mut instructions: Vec<Instruction>,
    start_time: Instant,
    logger: &Logger,
) -> Result<Vec<String>> {
    let txs = vec![];
    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&keypair.pubkey()),
        &[keypair],
        recent_blockhash,
    );
    txs.push(tx.serialize().to_string());
    let client = Arc::new(RpcClient::new(env::var("RPC_URL").unwrap()));
    let tx_hash = client.send_transaction(&tx).await?;
    logger.info(&format!("Transaction sent: {}", tx_hash));
    Ok(txs)
}

pub async fn new_signed_and_send_nozomi(
    recent_blockhash: solana_sdk::hash::Hash,
    keypair: &Keypair,
    mut instructions: Vec<Instruction>,
    logger: &Logger,
) -> Result<Vec<String>> {
    let txs = vec![];
    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&keypair.pubkey()),
        &[keypair],
        recent_blockhash,
    );
    txs.push(tx.serialize().to_string());
    let client = Arc::new(RpcClient::new(env::var("RPC_URL").unwrap()));
    let tx_hash = client.send_transaction(&tx).await?;
    logger.info(&format!("Transaction sent: {}", tx_hash));
    Ok(txs)
}
