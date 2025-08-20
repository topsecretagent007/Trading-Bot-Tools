use clap::ValueEnum;
use serde::Deserialize;

#[derive(ValueEnum, Debug, Clone, Deserialize, PartialEq)]
pub enum SwapDirection {
    #[serde(rename = "buy")]
    Buy,
    #[serde(rename = "sell")]
    Sell,
}
impl From<SwapDirection> for u8 {
    fn from(value: SwapDirection) -> Self {
        match value {
            SwapDirection::Buy => 0,
            SwapDirection::Sell => 1,
        }
    }
    fn from_u8(value: u8) -> Self {
        match value {
            0 => SwapDirection::Buy,
            1 => SwapDirection::Sell,
            _ => panic!("Invalid swap direction"),
        }
    }
}

#[derive(ValueEnum, Debug, Clone, Deserialize)]
pub enum SwapInType {
    /// Quantity
    #[serde(rename = "qty")]
    Qty,
    /// Percentage
    #[serde(rename = "pct")]
    Pct,
}
