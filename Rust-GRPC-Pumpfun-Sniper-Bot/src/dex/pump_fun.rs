use std::{str::FromStr, sync::Arc, time::Duration};

use anyhow::{anyhow, Result};
use borsh::from_slice;
use borsh_derive::{BorshDeserialize, BorshSerialize};
use chrono::Utc;
use colored::Colorize;
use serde::{Deserialize, Serialize};
use anchor_client::{solana_client, solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    system_program,
}};
use spl_associated_token_account::{
    get_associated_token_address, instruction::{create_associated_token_account, create_associated_token_account_idempotent},
};
use spl_token::{amount_to_ui_amount, ui_amount_to_amount};
use spl_token_client::token::TokenError;
use tokio::time::Instant;

use crate::{
    common::{config::SwapConfig, logger::Logger},
    core::token,
    engine::{monitor::BondingCurveInfo, swap::{SwapDirection, SwapInType}},
};

pub const TEN_THOUSAND: u64 = 10000;
pub const TOKEN_PROGRAM: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
pub const RENT_PROGRAM: &str = "SysvarRent111111111111111111111111111111111";
pub const ASSOCIATED_TOKEN_PROGRAM: &str = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
pub const PUMP_GLOBAL: &str = "4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf";
pub const PUMP_FEE_RECIPIENT: &str = "7VtfL8fvgNfhz17qKRMjzQEXgbdpnHHHQRh54R9jP2RJ";
pub const PUMP_PROGRAM: &str = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
// pub const PUMP_FUN_MINT_AUTHORITY: &str = "TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM";
pub const PUMP_ACCOUNT: &str = "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1";
pub const PUMP_BUY_METHOD: u64 = 16927863322537952870;
pub const PUMP_SELL_METHOD: u64 = 12502976635542562355;
pub const PUMP_FUN_CREATE_IX_DISCRIMINATOR: &[u8] = &[24, 30, 200, 40, 5, 28, 7, 119];
pub const INITIAL_VIRTUAL_SOL_RESERVES: u64 = 30_000_000_000;
pub const INITIAL_VIRTUAL_TOKEN_RESERVES: u64 = 73_000_000_000_000;
pub const TOKEN_TOTAL_SUPPLY: u64 = 1_000_000_000_000_000;

#[derive(Clone)]
pub struct Pump {
    pub rpc_nonblocking_client: Arc<anchor_client::solana_client::nonblocking::rpc_client::RpcClient>,
    pub keypair: Arc<Keypair>,
    pub rpc_client: Option<Arc<anchor_client::solana_client::rpc_client::RpcClient>>,
}

pub fn get_pda(mint: &Pubkey, program_id: &Pubkey) -> Result<Pubkey> {
    let seeds = [b"bonding-curve".as_ref(), mint.as_ref()];
    let (bonding_curve, _bump) = Pubkey::find_program_address(&seeds, program_id);
    Ok(bonding_curve)
}

pub fn get_creator_vault(creator: &Pubkey, program_id: &Pubkey) -> Result<Pubkey> {
    let seeds = [b"creator-vault".as_ref(), creator.as_ref()];
    let (bonding_curve, _bump) = Pubkey::find_program_address(&seeds, program_id);
    Ok(bonding_curve)
}
