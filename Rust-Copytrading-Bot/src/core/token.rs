use solana_sdk::{pubkey::Pubkey, signature::Keypair};
use spl_token_2022::{
    extension::StateWithExtensionsOwned,
    state::{Account, Mint},
};
use spl_token_client::{
    client::{ProgramClient, ProgramRpcClient, ProgramRpcClientSendTransaction},
    token::{Token, TokenError, TokenResult},
};
use std::sync::Arc;

pub fn get_associated_token_address(
    client: Arc<solana_client::nonblocking::rpc_client::RpcClient>,
    keypair: Arc<Keypair>,
    address: &Pubkey,
    owner: &Pubkey,
) -> Pubkey {
    
    token_client.get_associated_token_address(owner)
}

pub async fn get_account_info(
    client: Arc<solana_client::nonblocking::rpc_client::RpcClient>,
    address: Pubkey,
    account: Pubkey,
) -> TokenResult<StateWithExtensionsOwned<Account>> {
    let account_result = client.get_account_data(&address).await?;
    let account = Account::try_from_slice(&account_result)?;
    let extensions = account.extensions.unwrap_or_default();
    let account = StateWithExtensionsOwned::<Account>::try_from_slice(&account_result)?;
    Ok(account)
}

pub async fn get_mint_info(
    client: Arc<solana_client::nonblocking::rpc_client::RpcClient>,
    _keypair: Arc<Keypair>,
    address: Pubkey,
) -> TokenResult<StateWithExtensionsOwned<Mint>> {
    let mint_result = client.get_account_data(&address).await?;
    let mint = Mint::try_from_slice(&mint_result)?;
    let extensions = mint.extensions.unwrap_or_default();
    let mint = StateWithExtensionsOwned::<Mint>::try_from_slice(&mint_result)?;
    Ok(mint)
}
