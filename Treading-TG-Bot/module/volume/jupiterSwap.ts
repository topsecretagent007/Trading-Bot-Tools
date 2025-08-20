import { AccountInfo, Blockhash, Commitment, LAMPORTS_PER_SOL, SystemProgram, TransactionInstruction } from '@solana/web3.js';

//import { MARKET_STATE_LAYOUT_V3, MARKET_STATE_LAYOUT_V2, LiquidityPoolKeysV4, Liquidity, Percent, Token,TokenAmount } from '@raydium-io/raydium-sdk';
import { Liquidity, Percent, LiquidityPoolKeysV4, LiquidityStateV4, TokenAmount, Token, LiquidityPoolInfo, CurrencyAmount, SOL, BigNumberish } from '@raydium-io/raydium-sdk';
import {
    ComputeBudgetProgram,
    Connection,
    Keypair,
    PublicKey,
    TransactionMessage,
    VersionedTransaction,
} from '@solana/web3.js';
import {
    createAssociatedTokenAccountIdempotentInstruction,
    createCloseAccountInstruction,
    createSyncNativeInstruction,
    getAssociatedTokenAddress,
    getMint,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { } from '@raydium-io/raydium-sdk';
import { Pool } from './pool';
import { BN } from 'bn.js';
import { SLIPPAGE } from '../../constants';
import { sendAndConfirmTransaction } from '@solana/web3.js';
import { RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT } from '../../config';
import base58 from 'bs58';
import axios from 'axios';


export class jupiterSwap {

    private mainKp: Keypair;
    private connection: Connection;
    constructor(
        connection: Connection,
        mainKp: Keypair,
    ) {
        console.log(mainKp)
        this.mainKp = mainKp;
        this.connection = connection
    }

    public buy = async (wallet: Keypair, baseMint: PublicKey, amount: number) => {
        console.log("buy", baseMint, amount)
        try {
            const quoteResponse = await (
                await fetch(
                    `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${baseMint.toBase58()}&amount=${amount}&slippageBps=${SLIPPAGE}`
                )
            ).json();
            // get serialized transactions for the swap
            const response = await (
                await fetch("https://quote-api.jup.ag/v6/swap", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        quoteResponse,
                        userPublicKey: wallet.publicKey.toString(),
                        wrapAndUnwrapSol: true,
                        dynamicComputeUnitLimit: true,
                        prioritizationFeeLamports: 100000
                    }),
                }))
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: any = await response.json();

            // deserialize the transaction
            const swapTransactionBuf = Buffer.from(data.swapTransaction, "base64");
            var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            // sign the transaction
            transaction.sign([wallet]);
            return transaction;
        } catch (error) {
            console.log("Failed to get buy transaction", error)
            throw new Error("error");

        }
    }
    public sell = async (wallet: Keypair, baseMint: PublicKey, amount: number) => {
        try {
            const quoteResponse = await (
                await fetch(
                    `https://quote-api.jup.ag/v6/quote?inputMint=${baseMint.toBase58()}&outputMint=So11111111111111111111111111111111111111112&amount=${amount}&slippageBps=${SLIPPAGE}`
                )
            ).json();
            // get serialized transactions for the swap
            const data: any = await (
                await fetch("https://quote-api.jup.ag/v6/swap", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        quoteResponse,
                        userPublicKey: wallet.publicKey.toString(),
                        wrapAndUnwrapSol: true,
                        dynamicComputeUnitLimit: true,
                        prioritizationFeeLamports: 52000
                    }),
                })
            ).json();
            // deserialize the transaction
            const swapTransactionBuf = Buffer.from(data.swapTransaction, "base64");
            var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            // sign the transaction
            transaction.sign([wallet]);
            return transaction;
        } catch (error) {
            console.log(error)
            throw new Error("Failed to get sell Transaction")
        }
    }
    public execute = async (transaction: VersionedTransaction, isBuy: boolean | 1 = true) => {
        const latestBlockhash = await this.connection.getLatestBlockhash();
        const signature = await this.connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true })
        const confirmation = await this.connection.confirmTransaction(
            {
                signature,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                blockhash: latestBlockhash.blockhash,
            }
        );
        if (confirmation.value.err) {
            console.log("Confirmtaion error")
            return ""
        } else {
            if (isBuy === 1) {
                return signature
            } else if (isBuy)
                console.log(`Success in buy transaction: https://solscan.io/tx/${signature}`)
            else
                console.log(`Success in Sell transaction: https://solscan.io/tx/${signature}`)
        }
        return signature
    }
    public executeJitoTx = async (transactions: VersionedTransaction, commitment: Commitment) => {
        try {
            let latestBlockhash = await this.connection.getLatestBlockhash();
            console.log("transactions--->", transactions)
            const jitoTxsignature = base58.encode(transactions.signatures[0]);

            console.log("Waiting for response")
            const confirmation = await this.connection.confirmTransaction(
                {
                    signature: jitoTxsignature,
                    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                    blockhash: latestBlockhash.blockhash,
                },
                commitment,
            );

            console.log("Wallets bought the token plz check keypairs in the data.json file in key folder")

            if (confirmation.value.err) {
                console.log("Confirmtaion error")
                throw new Error("Confirmation error");

            } else {
                return jitoTxsignature;
            }
        } catch (error) {
            console.log('Error during transaction execution', error);
            throw new Error("eeror during Tx execution");

        }
    }
};

