use crate::common::config::{LiquidityPool, Status, JUPITER_PROGRAM};
use maplit::hashmap;
use solana_sdk::hash::Hash;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Signature;
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};

use super::swap::{SwapDirection, SwapInType};
use crate::{
    common::{
        config::{AppState, SwapConfig},
        logger::Logger,
        targetlist::Targetlist,
    },
    core::tx,
    dex::pump_fun::{Pump, PUMP_PROGRAM},
};
use anyhow::Result;
use chrono::Utc;
use colored::Colorize;
use futures_util::{stream::StreamExt, SinkExt};
use spl_token::amount_to_ui_amount;
use tokio::{
    task,
    time::{self, Duration, Instant},
};
use yellowstone_grpc_client::{ClientTlsConfig, GeyserGrpcClient};
use yellowstone_grpc_proto::geyser::{
    subscribe_update::UpdateOneof, CommitmentLevel, SubscribeRequest,
    SubscribeRequestFilterTransactions, SubscribeUpdateTransaction,
};

#[derive(Clone, Debug)]
pub struct TradeInfoFromToken {
    pub slot: u64,
    pub recent_blockhash: Hash,
    pub signature: String,
    pub target: String,
    pub mint: String,
    pub token_amount_list: TokenAmountList,
    pub sol_amount_list: SolAmountList,
}

#[derive(Clone, Debug)]
pub struct TokenAmountList {
    token_pre_amount: f64,
    token_post_amount: f64,
}

#[derive(Clone, Debug)]
pub struct SolAmountList {
    sol_pre_amount: u64,
    sol_post_amount: u64,
}

impl TradeInfoFromToken {
    pub fn from_json(txn: SubscribeUpdateTransaction) -> Result<Self> {
        let slot = txn.slot;
        let (recent_blockhash, signature, target, mint, token_amount_list, sol_amount_list) =
           

        Ok(Self {
            slot,
            recent_blockhash,
            signature,
            target,
            mint,
            token_amount_list,
            sol_amount_list,
        })
    }
}

pub async fn check_pt_sl_mc_autosell(
    existing_liquidity_pools: Arc<Mutex<HashSet<LiquidityPool>>>,
    app_state: AppState,
    take_profit: f64,
    stop_loss: f64,
    market_cap_threshold: f64,
    slippage: u64,
) {
   
}

pub async fn copytrader_pumpfun(
    yellowstone_grpc_http: String,
    yellowstone_grpc_token: String,
    app_state: AppState,
    buy_token_percent: f64,
    sell_token_percent: f64,
    slippage: u64,
    market_cap_threshold: f64,
    take_profit: f64,
    stop_loss: f64,
    targetlist: Targetlist,
) -> Result<(), String> {
    
}
