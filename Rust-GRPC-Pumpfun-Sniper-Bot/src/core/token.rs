use anchor_client::solana_sdk::{pubkey::Pubkey, signature::Keypair};
use spl_token_2022::{
    extension::StateWithExtensionsOwned,
    state::{Account, Mint},
};
use spl_token_client::{
    client::{ProgramClient, ProgramRpcClient, ProgramRpcClientSendTransaction},
    token::{Token, TokenError, TokenResult},
};
use std::sync::Arc;

pub async fn get_mint_info(
    client: Arc<anchor_client::solana_client::nonblocking::rpc_client::RpcClient>,
    _keypair: Arc<Keypair>,
    address: Pubkey,
) -> TokenResult<StateWithExtensionsOwned<Mint>> {
    let program_client = Arc::new(ProgramRpcClient::new(
        client.clone(),
        ProgramRpcClientSendTransaction,
    ));
    let account = program_client
        .get_account(address)
        .await
        .map_err(TokenError::Client)?
        .ok_or(TokenError::AccountNotFound)
        .inspect_err(|err| println!("{} {}: mint {}", address, err, address))?;

    if account.owner != spl_token::ID {
        return Err(TokenError::AccountInvalidOwner);
    }

    let mint_result = StateWithExtensionsOwned::<Mint>::unpack(account.data).map_err(Into::into);
    let decimals: Option<u8> = None;
    if let (Ok(mint), Some(decimals)) = (&mint_result, decimals) {
        if decimals != mint.base.decimals {
            return Err(TokenError::InvalidDecimals);
        }
    }

    mint_result
}
