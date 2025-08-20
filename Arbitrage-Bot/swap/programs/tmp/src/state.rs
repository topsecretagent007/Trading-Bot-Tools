use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct SwapState { 
    pub start_balance: u64,        // Start of swap balance
    pub swap_input: u64,           // Output of swap (input for next swap)
    pub is_valid: bool,            // Safety flag to prevent invalid swaps
    pub total_swaps: u64,          // Total number of swaps executed
    pub total_volume: u64,         // Total volume processed
    pub total_profit: u64,         // Total profit accumulated
    pub created_at: i64,           // Timestamp when state was created
    pub current_swap_start: i64,   // Timestamp when current swap started
    pub last_swap_time: i64,       // Timestamp of last swap
}

impl SwapState {
    pub const INIT_SPACE: usize = 8 + 8 + 8 + 1 + 8 + 8 + 8 + 8 + 8 + 8;
}
