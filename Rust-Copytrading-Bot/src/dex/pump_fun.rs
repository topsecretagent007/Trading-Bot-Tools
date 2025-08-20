use anyhow::{anyhow, Result};
use borsh::from_slice;
use borsh_derive::{BorshDeserialize, BorshSerialize};
use chrono::Utc;
use colored::Colorize;
use serde::{Deserialize, Serialize};
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    native_token::LAMPORTS_PER_SOL,
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    system_program,
};
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account,
};
use spl_token::{amount_to_ui_amount, ui_amount_to_amount};
use spl_token_client::token::TokenError;
use std::{str::FromStr, sync::Arc, time::Duration};
use tokio::time::Instant;

use crate::{
    common::{config::SwapConfig, logger::Logger},
    core::token,
    engine::swap::{SwapDirection, SwapInType},
};

pub const TEN_THOUSAND: u128 = 10000;
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

#[derive(Clone)]
pub struct Pump {
    pub rpc_nonblocking_client: Arc<solana_client::nonblocking::rpc_client::RpcClient>,
    pub keypair: Arc<Keypair>,
    pub rpc_client: Option<Arc<solana_client::rpc_client::RpcClient>>,
}

impl Pump {
    pub fn new(
        rpc_nonblocking_client: Arc<solana_client::nonblocking::rpc_client::RpcClient>,
        rpc_client: Arc<solana_client::rpc_client::RpcClient>,
        keypair: Arc<Keypair>,
    ) -> Self {
        Self {
            rpc_nonblocking_client,
            keypair,
            rpc_client: Some(rpc_client),
        }
    }

        mint_str: &str,
        swap_config: SwapConfig,
        start_time: Instant,
    ) -> Result<(bool, Arc<Keypair>, Vec<Instruction>, f64, f64)> {
        let logger = Logger::new("[PUMPFUN-SWAP-BY-MINT] => ".blue().to_string());
        // logger.log(
        //     format!(
        //         "[SWAP-BEGIN]({}) - {} :: {:?}",
        //         mint_str,
        //         chrono::Utc::now(),
        //         start_time.elapsed()
        //     )
        //     .yellow()
        //     .to_string(),
        // );
        // Constants
        // ---------------------------------------------------
        let slippage_bps = swap_config.slippage * 100;
        let owner = self.keypair.pubkey();
        let mint = Pubkey::from_str(mint_str)
            .map_err(|_| anyhow!(format!("Failed to parse Pubkey from '{}'", mint_str)))?;
        let program_id = spl_token::ID;
        let native_mint = spl_token::native_mint::ID;
        let (token_in, token_out, pump_method) = match swap_config.swap_direction {
            SwapDirection::Buy => (native_mint, mint, PUMP_BUY_METHOD),
            SwapDirection::Sell => (mint, native_mint, PUMP_SELL_METHOD),
        };
        let pump_program = Pubkey::from_str(PUMP_PROGRAM)?;

        let mut create_instruction = None;
        let mut close_instruction = None;

        // RPC requests
        // ---------------------------------------------------
        // let nonblocking_clinet_clone = self.rpc_nonblocking_client.clone();
        let rpc_client = match self.rpc_client.clone() {
            Some(client) => client,
            None => return Err(anyhow!("RPC client is not available")),
        };
        
        let (bonding_curve, associated_bonding_curve, bonding_curve_account) =
            get_bonding_curve_account(rpc_client, mint, pump_program).await?;
        // logger.log(format!("Get bonding curve: {:?}", start_time.elapsed()));
        // let bonding_curve_handle = tokio::spawn(get_bonding_curve_account(
        //     self.rpc_client.clone().unwrap(),
        //     mint,
        //     pump_program,
        // ));
        // let blockhash_handle: tokio::task::JoinHandle<
        //     std::result::Result<solana_sdk::hash::Hash, solana_client::client_error::ClientError>,
        // > = tokio::spawn(async move { nonblocking_clinet_clone.get_latest_blockhash().await });
        // let ((bonding_curve, associated_bonding_curve, bonding_curve_account), recent_blockhash) =
        //     match tokio::try_join!(bonding_curve_handle, blockhash_handle) {
        //         Ok((bonding_curve_result, blockhash_result)) => {
        //             let bonding_curve_result = bonding_curve_result?;
        //             let blockhash_result = blockhash_result?;
        //             (bonding_curve_result, blockhash_result)
        //         }
        //         Err(err) => {
        //             logger.log(format!("Failed with {}, ", err).red().to_string());
        //             return Err(anyhow!(format!("Failed with {}", err)));
        //         }
        //     };

        // Calculate tokens out
        let virtual_sol_reserves = bonding_curve_account.virtual_sol_reserves as u128;
        let virtual_token_reserves = bonding_curve_account.virtual_token_reserves as u128;
        let token_total_supply = bonding_curve_account.token_total_supply as u128;
        let creator_pub = bonding_curve_account.creator;
        let creator_pub = creator_pub.ok_or_else(|| anyhow!("BondingCurveAccount.creator is None"))?;
        let creator_vault = get_creator_vault(&creator_pub, &pump_program)?;

        let in_ata = token::get_associated_token_address(
            self.rpc_nonblocking_client.clone(),
            self.keypair.clone(),
            &token_in,
            &owner,
        );

        let out_ata = token::get_associated_token_address(
            self.rpc_nonblocking_client.clone(),
            self.keypair.clone(),
            &token_out,
            &owner,
        );
        // logger.log(format!(
        //     "Amount Specified Start: {:?}",
        //     start_time.elapsed()
        // ));
        let mut sold_out = false;
        let (amount_specified, _amount_ui_pretty) = match swap_config.swap_direction {
            SwapDirection::Buy => {
                // logger.log(format!(
                //     "Amount Specified => (Buy) start: {:?}",
                //     start_time.elapsed()
                // ));
                // Create base ATA if it doesn't exist.
                // ----------------------------
                match token::get_account_info(
                    self.rpc_nonblocking_client.clone(),
                    token_out,
                    out_ata,
                )
                .await
                {
                    Ok(_) => {
                        // Base ata exists. skipping creation..
                        // --------------------------
                    }
                    Err(TokenError::AccountNotFound) | Err(TokenError::AccountInvalidOwner) => {
                        // "Base ATA for mint {} does not exist. will be create", token_out
                        // --------------------------
                        create_instruction = Some(create_associated_token_account(
                            &owner,
                            &owner,
                            &token_out,
                            &program_id,
                        ));
                    }
                    Err(_) => {
                        // Error retrieving out ATA
                        // ---------------------------
                    }
                }
                // logger.log(format!(
                //     "Amount Specified => (Buy) end: {:?}",
                //     start_time.elapsed()
                // ));

                (
                    ui_amount_to_amount(swap_config.amount_in, spl_token::native_mint::DECIMALS),
                    (swap_config.amount_in, spl_token::native_mint::DECIMALS),
                )
            }
            SwapDirection::Sell => {
                let in_account_handle = tokio::spawn(token::get_account_info(
                    self.rpc_nonblocking_client.clone(),
                    token_in,
                    in_ata,
                ));
                let in_mint_handle = tokio::spawn(token::get_mint_info(
                    self.rpc_nonblocking_client.clone(),
                    self.keypair.clone(),
                    token_in,
                ));
                // logger.log(format!(
                //     "Amount Specified => (Sell) start: {:?}",
                //     start_time.elapsed()
                // ));

                let (in_account, in_mint) =
                    match tokio::try_join!(in_account_handle, in_mint_handle) {
                        Ok((in_account_result, in_mint_result)) => {
                            let in_account_result = in_account_result?;
                            let in_mint_result = in_mint_result?;
                            (in_account_result, in_mint_result)
                        }
                        Err(err) => {
                            logger.log(format!("Failed with {}, ", err).red().to_string());
                            return Err(anyhow!(format!("Failed with {}", err)));
                        }
                    };
                // logger.log(format!(
                //     "Amount Specified => (Sell) end: {:?}",
                //     start_time.elapsed()
                // ));

                let amount = match swap_config.in_type {
                    SwapInType::Qty => {
                        let amount_qty =
                            ui_amount_to_amount(swap_config.amount_in, in_mint.base.decimals);
                        let max_sol_cost =
                            max_amount_with_slippage(amount_qty, slippage_bps as u128);

                        // Check token amount you are going to sell with the ones in your wallet.
                        // ---------------------
                        if max_sol_cost >= in_account.base.amount {
                            // Sell all. will be close ATA for mint {token_in}
                            // --------------------------------
                            close_instruction = Some(spl_token::instruction::close_account(
                                &program_id,
                                &in_ata,
                                &owner,
                                &owner,
                                &[&owner],
                            )?);
                            sold_out = true;
                            in_account.base.amount
                        } else {
                            amount_qty
                        }
                    }
                    SwapInType::Pct => {
                        let amount_in_pct = swap_config.amount_in.min(1.0);
                        if amount_in_pct == 1.0 {
                            // Sell all. will be close ATA for mint {token_in}
                            // --------------------------------
                            close_instruction = Some(spl_token::instruction::close_account(
                                &program_id,
                                &in_ata,
                                &owner,
                                &owner,
                                &[&owner],
                            )?);
                            sold_out = true;
                            in_account.base.amount
                        } else {
                            (amount_in_pct * 100.0) as u64 * in_account.base.amount / 100
                        }
                    }
                };
                (
                    amount,
                    (
                        amount_to_ui_amount(amount, in_mint.base.decimals),
                        in_mint.base.decimals,
                    ),
                )
            }
        };
        // logger.log(format!("Amount Specified End: {:?}", start_time.elapsed()));

        let token_price: f64 = (virtual_sol_reserves as f64) / (virtual_token_reserves as f64);
        let market_cap: f64 = (token_price * token_total_supply as f64) / LAMPORTS_PER_SOL as f64; // (sol)

        let (token_amount, sol_amount_threshold, input_accouts) = match swap_config.swap_direction {
            SwapDirection::Buy => {
                let max_sol_cost = max_amount_with_slippage(amount_specified, slippage_bps as u128);
                let amount_result = u128::from(amount_specified)
                    .checked_mul(virtual_token_reserves)
                    .expect("Failed to multiply amount_specified by virtual_token_reserves: overflow occurred.")
                    .checked_div(virtual_sol_reserves)
                    .expect("Failed to divide the result by virtual_sol_reserves: division by zero or overflow occurred.");
                (
                    amount_result as u64,
                    max_sol_cost,
                    vec![
                        AccountMeta::new_readonly(Pubkey::from_str(PUMP_GLOBAL)?, false),
                        AccountMeta::new(Pubkey::from_str(PUMP_FEE_RECIPIENT)?, false),
                        AccountMeta::new_readonly(mint, false),
                        AccountMeta::new(bonding_curve, false),
                        AccountMeta::new(associated_bonding_curve, false),
                        AccountMeta::new(out_ata, false),
                        AccountMeta::new(owner, true),
                        AccountMeta::new_readonly(system_program::id(), false),
                        AccountMeta::new_readonly(program_id, false),
                        AccountMeta::new(creator_vault, false),
                        AccountMeta::new_readonly(Pubkey::from_str(PUMP_ACCOUNT)?, false),
                        AccountMeta::new_readonly(pump_program, false),
                    ],
                )
            }
            SwapDirection::Sell => {
                // println!(">>[{}] {}:{}:{}", mint_str, amount_specified, virtual_sol_reserves, virtual_token_reserves);
                let sol_output = if virtual_token_reserves != 0 {
                    u128::from(amount_specified)
                        .checked_mul(virtual_sol_reserves)
                        .expect(&format!("[{}]Failed to multiply amount_specified by virtual_sol_reserves: overflow occurred.", mint_str))
                        .checked_div(virtual_token_reserves)
                        .expect(&format!("[{}]Failed to divide the result by virtual_token_reserves: division by zero or overflow occurred.", mint_str))
                } else {
                    0_u128
                };

                let min_sol_output =
                    min_amount_with_slippage(sol_output as u64, slippage_bps as u128);

                (
                    amount_specified,
                    min_sol_output,
                    vec![
                        AccountMeta::new_readonly(Pubkey::from_str(PUMP_GLOBAL)?, false),
                        AccountMeta::new(Pubkey::from_str(PUMP_FEE_RECIPIENT)?, false),
                        AccountMeta::new_readonly(mint, false),
                        AccountMeta::new(bonding_curve, false),
                        AccountMeta::new(associated_bonding_curve, false),
                        AccountMeta::new(in_ata, false),
                        AccountMeta::new(owner, true),
                        AccountMeta::new_readonly(system_program::id(), false),
                        AccountMeta::new(creator_vault, false),
                        AccountMeta::new_readonly(program_id, false),
                        AccountMeta::new_readonly(Pubkey::from_str(PUMP_ACCOUNT)?, false),
                        AccountMeta::new_readonly(pump_program, false),
                    ],
                )
            }
        };

        // Constants-Instruction Configuration
        // -------------------
        let build_swap_instruction = Instruction::new_with_bincode(
            pump_program,
            &(pump_method, token_amount, sol_amount_threshold),
            input_accouts,
        );

        let mut instructions = vec![];
        if let Some(create_instruction) = create_instruction {
            instructions.push(create_instruction);
        }
        if amount_specified > 0 {
            instructions.push(build_swap_instruction)
        }
        if let Some(close_instruction) = close_instruction {
            instructions.push(close_instruction);
        }
        if instructions.is_empty() {
            return Err(anyhow!("Instructions is empty, no txn required."
                .red()
                .italic()
                .to_string()));
        }
        // logger.log(
        //     format!(
        //         "[BUILD-TXN]({}) - {} :: ({:?})",
        //         mint_str,
        //         Utc::now(),
        //         start_time.elapsed()
        //     )
        //     .yellow()
        //     .to_string(),
        // );

        // Expire Condition
        // -------------------
        // if swap_config.swap_direction == SwapDirection::Buy
        //     && start_time.elapsed() > Duration::from_millis(900)
        // {
        //     return Err(anyhow!(format!(
        //         "RPC connection is too busy with {:?}. Expire this txn.",
        //         start_time.elapsed()
        //     )
        //     .red()
        //     .italic()
        //     .to_string()));
        // }

        // Return- (instructions, token_price, market_cap)
        // --------------------
        Ok((
            // recent_blockhash,
            sold_out,
            self.keypair.clone(),
            instructions,
            token_price,
            market_cap,
        ))
    }
}


// https://frontend-api.pump.fun/coins/8zSLdDzM1XsqnfrHmHvA9ir6pvYDjs8UXz6B2Tydd6b2
// pub async fn get_pump_info(
//     rpc_client: Arc<solana_client::rpc_client::RpcClient>,
//     mint: &str,
// ) -> Result<PumpInfo> {
//     let mint = Pubkey::from_str(mint)?;
//     let program_id = Pubkey::from_str(PUMP_PROGRAM)?;
//     let (bonding_curve, associated_bonding_curve, bonding_curve_account) =
//         get_bonding_curve_account(rpc_client, mint, program_id).await?;

//     let pump_info = PumpInfo {
//         mint: mint.to_string(),
//         bonding_curve: bonding_curve.to_string(),
//         associated_bonding_curve: associated_bonding_curve.to_string(),
//         raydium_pool: None,
//         raydium_info: None,
//         complete: bonding_curve_account.complete,
//         virtual_sol_reserves: bonding_curve_account.virtual_sol_reserves,
//         virtual_token_reserves: bonding_curve_account.virtual_token_reserves,
//         total_supply: bonding_curve_account.token_total_supply,
//     };
//     Ok(pump_info)
// }
