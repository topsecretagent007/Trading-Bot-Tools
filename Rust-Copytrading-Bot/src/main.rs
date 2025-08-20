use std::env;

use raypump_copytrading_bot::{
    common::{config::Config, constants::RUN_MSG},
    engine::monitor::{copytrader_pumpfun, ping_test},
};

#[tokio::main]
async fn main() {
    /* Initial Settings */
    let config = Config::new().await;

    // Get command line arguments
    let args: Vec<String> = env::args().collect();

    // Check if an argument is provided
    if args.len() > 1 {
        let command = &args[1];

        // If the first argument is "ping_test", run the ping_test function
        if command == "ping_test" {
            println!("Running ping test...");
            let _ = ping_test(
                config.yellowstone_grpc_http.clone(),
                config.yellowstone_grpc_token.clone(),
            )
            .await;
            return; // Exit the program after ping test
        }
    }

    /* Running Bot */
    let run_msg = RUN_MSG;
    println!("{}", run_msg);

    let _ = copytrader_pumpfun(
        config.yellowstone_grpc_http,
        config.yellowstone_grpc_token,
        config.app_state,
        config.buy_token_percent,
        config.sell_token_percent,
        config.slippage,
        config.market_cap,
        config.take_profit,
        config.stop_loss,
        config.targetlist,
    )
    .await;
}
