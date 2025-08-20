import {
  TOKEN_PROGRAM_ID,
  Token,
  TokenAmount,
  Liquidity,
  TxVersion,
  LiquidityPoolKeysV4,
  jsonInfo2PoolKeys,
  InnerSimpleV0Transaction,
  buildSimpleTransaction,
  LOOKUP_TABLE_CACHE,
} from "@raydium-io/raydium-sdk";
import { Keypair, PublicKey } from "@solana/web3.js";
import { sendTx } from "./build_a_sendtxn";
import { getATAAddress, getWalletTokenAccount, sleep } from "./utils";
import { cluster, connection, } from "../config";
import { formatAmmKeysById } from "./swapOnlyAmm";

export const ammRemoveLiquidity = async (
  mainKp: Keypair,
  poolId: PublicKey,
  poolKeysParam?: LiquidityPoolKeysV4 | null,
) => {
  try {
    
  } catch (e: unknown) {
    console.log(`Remove liquidity error: `, e);
  }
};


async function buildAndSendTx(
  keypair: Keypair,
  innerSimpleV0Transaction: InnerSimpleV0Transaction[],
) {
  const willSendTx = await buildSimpleTransaction({
    connection,
    makeTxVersion: TxVersion.V0,
    payer: keypair.publicKey,
    innerTransactions: innerSimpleV0Transaction,
    addLookupTableInfo: cluster == "devnet" ? undefined : LOOKUP_TABLE_CACHE,
  });
  return await sendTx(connection, keypair, willSendTx, { skipPreflight: true });
}

