use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("No profit at the end. Reverting...")]
    NoProfit,
    #[msg("Trying to swap when information is invalid.")]
    InvalidState,
    #[msg("Not enough funds: amount_in > src_balance.")]
    NotEnoughFunds,
    #[msg("Invalid amount: must be greater than 0.")]
    InvalidAmount,
    #[msg("Arithmetic overflow occurred.")]
    Overflow,
    #[msg("Swap state not initialized.")]
    NotInitialized,
    #[msg("Invalid pool configuration.")]
    InvalidPoolConfig,
    #[msg("Slippage tolerance exceeded.")]
    SlippageExceeded,
}