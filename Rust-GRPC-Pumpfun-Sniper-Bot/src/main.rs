use pumpfun_sniper::{
    common::{config::Config, constants::RUN_MSG},
    engine::monitor::new_token_trader_pumpfun,
};

#[tokio::main]
async fn main() {
    /* Initial Settings */
    let config = Config::new().await;
    let config = config.lock().await;

    /* Running Bot */
    let run_msg = RUN_MSG;
    println!("{}", run_msg);

    let tip_account = get_tip_account();
    let tip_account = tip_account.unwrap();
    println!("tip_account: {:?}", tip_account);
    let tip_account1 = get_tip_account1();
    let tip_account1 = tip_account1.unwrap();
    println!("tip_account1: {:?}", tip_account1);
    let tip_account2 = get_tip_account2();
    let tip_account2 = tip_account2.unwrap();
    println!("tip_account2: {:?}", tip_account2);

    let _ = new_token_trader_pumpfun(
        config.yellowstone_grpc_http.clone(),
        config.yellowstone_grpc_token.clone(),
        config.app_state.clone(),
        config.swap_config.clone(),
        config.min_dev_buy as u64,
        config.max_dev_buy as u64,
        config.take_profit.clone(),
        config.stop_loss.clone()
    )
    .inspect_err(|err| {
        println!("{}", err);
    })
    .await;

}

