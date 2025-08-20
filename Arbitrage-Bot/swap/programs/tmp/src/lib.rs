use anchor_lang::prelude::*;
use anchor_spl::{
    token::{TokenAccount, Mint}
};
use anchor_lang::Accounts;

declare_id!("CRQXfRGq3wTkjt7JkqhojPLiKLYLjHPGLebnfiiQB46T");

use state::SwapState;
use error::ErrorCode; 

pub mod error; 
pub mod state; 
pub mod ix_data;
pub mod swaps; 

pub use swaps::*; 

#[program]
pub mod tmp {
    use super::*;

    /// Initialize the swap program state
    pub fn init_program(ctx: Context<InitSwapState>) -> Result<()> {
        let swap_state = &mut ctx.accounts.swap_state;
        swap_state.swap_input = 0;
        swap_state.is_valid = false;
        swap_state.total_swaps = 0;
        swap_state.total_volume = 0;
        swap_state.created_at = Clock::get()?.unix_timestamp;
        msg!("Swap program initialized successfully");
        Ok(())
    }
    
    /// Start a new swap sequence
    pub fn start_swap(ctx: Context<TokenAndSwapState>, swap_input: u64) -> Result<()> {
        require!(swap_input > 0, ErrorCode::InvalidAmount);
        
        let swap_state = &mut ctx.accounts.swap_state;
        swap_state.start_balance = ctx.accounts.src.amount;
        swap_state.swap_input = swap_input;
        swap_state.is_valid = true;
        swap_state.current_swap_start = Clock::get()?.unix_timestamp;
        swap_state.total_swaps += 1;
        swap_state.total_volume = swap_state.total_volume.checked_add(swap_input)
            .ok_or(ErrorCode::Overflow)?;
        
        msg!("Swap started with input amount: {}", swap_input);
        Ok(())
    }

    /// Verify profit and complete swap sequence
    pub fn profit_or_revert(ctx: Context<TokenAndSwapState>) -> Result<()> {
        let swap_state = &mut ctx.accounts.swap_state; 
        swap_state.is_valid = false;

        let init_balance = swap_state.start_balance;
        let final_balance = ctx.accounts.src.amount;
        let profit = final_balance.checked_sub(init_balance)
            .ok_or(ErrorCode::Overflow)?;
        
        msg!("Initial balance: {}, Final balance: {}, Profit: {}", 
             init_balance, final_balance, profit);
        
        // Ensure profit or revert
        require!(profit > 0, ErrorCode::NoProfit);
        
        // Update total profit
        swap_state.total_profit = swap_state.total_profit.checked_add(profit)
            .ok_or(ErrorCode::Overflow)?;
        
        msg!("Swap completed successfully with profit: {}", profit);
        Ok(())
    }

    /// Initialize an open orders account on Serum DEX
    pub fn init_open_order(ctx: Context<InitOpenOrder>) -> Result<()> {
        _init_open_order(ctx)
    }
    
    /// Execute swap on Orca DEX
    pub fn orca_swap<'info>(ctx: Context<'_, '_, '_, 'info, OrcaSwap<'info>>) -> Result<()> {
        basic_pool_swap!(_orca_swap, OrcaSwap<'info>)(ctx)
    }

    /// Execute swap on Mercurial DEX
    pub fn mercurial_swap<'info>(ctx: Context<'_, '_, '_, 'info, MercurialSwap<'info>>) -> Result<()> {
        basic_pool_swap!(_mercurial_swap, MercurialSwap<'info>)(ctx)
    }

    /// Execute swap on Saber DEX
    pub fn saber_swap<'info>(ctx: Context<'_, '_, '_, 'info, SaberSwap<'info>>) -> Result<()> {
        basic_pool_swap!(_saber_swap, SaberSwap<'info>)(ctx)
    }

    /// Execute swap on Aldrin V2 DEX
    pub fn aldrin_swap_v2<'info>(ctx: Context<'_, '_, '_, 'info, AldrinSwapV2<'info>>, is_inverted: bool) -> Result<()> {
        let amount_in = prepare_swap(&ctx.accounts.swap_state)?;

        _aldrin_swap_v2(&ctx, amount_in, is_inverted)?;

        // End swap 
        let user_dst = match is_inverted {
            true => &mut ctx.accounts.user_quote_ata,
            false => &mut ctx.accounts.user_base_ata 
        };
        let swap_state = &mut ctx.accounts.swap_state;
        end_swap(swap_state, user_dst)?;

        Ok(())
    }
    
    /// Execute swap on Aldrin V1 DEX
    pub fn aldrin_swap_v1<'info>(ctx: Context<'_, '_, '_, 'info, AldrinSwapV1<'info>>, is_inverted: bool) -> Result<()> {
        let amount_in = prepare_swap(&ctx.accounts.swap_state)?;

        _aldrin_swap_v1(&ctx, amount_in, is_inverted)?;

        // End swap 
        let user_dst = match is_inverted {
            true => &mut ctx.accounts.user_quote_ata,
            false => &mut ctx.accounts.user_base_ata 
        };
        let swap_state = &mut ctx.accounts.swap_state;
        end_swap(swap_state, user_dst)?;

        Ok(())
    }
    
    /// Execute swap on Serum DEX
    pub fn serum_swap<'info>(ctx: Context<'_, '_, '_, 'info, SerumSwap<'info>>, side: Side) -> Result<()> {
        let amount_in = prepare_swap(&ctx.accounts.swap_state)?;
        let is_bid = match side {
            Side::Bid => true,
            Side::Ask => false,
        };

        _serum_swap(&ctx, amount_in, side)?;
        
        // End swap 
        let user_dst = match is_bid {
            true => &mut ctx.accounts.market.coin_wallet,
            false => &mut ctx.accounts.pc_wallet,
        };
        let swap_state = &mut ctx.accounts.swap_state;
        end_swap(swap_state, user_dst)?;

        Ok(())
    }
}

#[macro_export]
macro_rules! basic_pool_swap {
    ($swap_fcn:expr, $typ:ident < $tipe:tt > ) => {{
        |ctx: Context<'_, '_, '_, 'info, $typ<$tipe>> | -> Result<()> {
            // Save the amount of input swap
            let amount_in = prepare_swap(&ctx.accounts.swap_state)?;

            // Execute swap 
            $swap_fcn(&ctx, amount_in)?;

            // Update the swap output amount (to be used as input to next swap)
            let swap_state = &mut ctx.accounts.swap_state;
            let user_dst = &mut ctx.accounts.user_dst;
            end_swap(swap_state, user_dst)?;

            Ok(())
        }
    }};
}

/// Complete a swap and update the swap state
pub fn end_swap(
    swap_state: &mut Account<SwapState>,
    user_dst: &mut Account<TokenAccount>
) -> Result<()> {
    // Derive the output of the swap 
    let dst_start_balance = user_dst.amount; // Pre-swap balance 
    user_dst.reload()?; // Update underlying account 
    let dst_end_balance = user_dst.amount; // Post-swap balance 
    let swap_amount_out = dst_end_balance.checked_sub(dst_start_balance)
        .ok_or(ErrorCode::Overflow)?;
    
    msg!("Swap amount out: {}", swap_amount_out);

    // Will be input amount into the next swap instruction
    swap_state.swap_input = swap_amount_out; 
    swap_state.last_swap_time = Clock::get()?.unix_timestamp;

    Ok(())
}

/// Prepare for a swap by validating the swap state
pub fn prepare_swap(
    swap_state: &Account<SwapState>,
) -> Result<u64> {
    require!(swap_state.is_valid, ErrorCode::InvalidState);
    
    // Get the swap in amount from the state 
    let amount_in = swap_state.swap_input;
    require!(amount_in > 0, ErrorCode::InvalidAmount);
    
    msg!("Swap amount in: {}", amount_in);
    
    Ok(amount_in)
}

#[derive(Accounts)]
pub struct InitSwapState<'info> {
    #[account(
        init, 
        payer = payer,
        space = 8 + SwapState::INIT_SPACE,
        seeds = [b"swap_state"], 
        bump, 
    )] 
    pub swap_state: Account<'info, SwapState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TokenAndSwapState<'info> {
    #[account(mut)]
    pub src: Account<'info, TokenAccount>,
    #[account(mut, seeds = [b"swap_state"], bump)] 
    pub swap_state: Account<'info, SwapState>,
}