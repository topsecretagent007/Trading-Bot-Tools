import { Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { PUMPFUN_POOL_AUTH } from "./constants/pumpfun";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createSyncNativeInstruction, createAssociatedTokenAccountInstruction, createCloseAccountInstruction } from "@solana/spl-token";
import { NATIVE_MINT } from "@solana/spl-token";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { connection as solanaConnection, PUMPFUN_PROGRAM_ID, PUMPSWAP_PROGRAM_ADDR, MINT_WALLET_PRIVATE } from "./constants/constants";
import base58 from "bs58";
import { PoolReserves } from "./src/pumpswap/types";
import { PUMPSWAP_EVENT_AUTH, PUMPSWAP_GLOBAL_CONFIG, PUMPSWAP_MAINNET_FEE_ADDR, PUMPSWAP_POOL } from "./constants/pumpswap";
import { createPumpswapBuyIx } from "./src/pumpswap/instructions";
import { PumpSdk } from "@pump-fun/pump-sdk";

const keypair = Keypair.fromSecretKey(base58.decode(MINT_WALLET_PRIVATE));

export const getMigrationBuyTx = async (mintAddress: PublicKey, coinCreator: PublicKey, buyAmount: number, slippage: number) => {
    // const tx = new Transaction();
    const ixs: TransactionInstruction[] = []
    const pumpSDK = new PumpSdk(solanaConnection, PUMPFUN_PROGRAM_ID, PUMPSWAP_PROGRAM_ADDR);

    const [creator] = PublicKey.findProgramAddressSync([Buffer.from(PUMPFUN_POOL_AUTH), mintAddress.toBuffer()], PUMPFUN_PROGRAM_ID)
    const buffer = Buffer.alloc(2); // 2 bytes for u16
    const [poolId] = PublicKey.findProgramAddressSync([
        Buffer.from(PUMPSWAP_POOL),             // const seed
        buffer,                                 // index seed
        creator.toBuffer(),                     // creator pubkey
        mintAddress.toBuffer(),  // base mint pubkey
        NATIVE_MINT.toBuffer()                  // quote mint pubkey
    ], PUMPSWAP_PROGRAM_ADDR)

    const [pumpammPoolBaseTokenAcc] = PublicKey.findProgramAddressSync([
        poolId.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mintAddress.toBuffer()
    ], ASSOCIATED_TOKEN_PROGRAM_ID);

    const [pumpammPoolQuoteTokenAcc] = PublicKey.findProgramAddressSync([
        poolId.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        NATIVE_MINT.toBuffer()
    ], ASSOCIATED_TOKEN_PROGRAM_ID);


    const migrationIx = await pumpSDK.migrateInstruction(mintAddress, keypair.publicKey);
    ixs.push(migrationIx);


    const wSolAccount = getAssociatedTokenAddressSync(NATIVE_MINT, keypair.publicKey);
    if (!await solanaConnection.getAccountInfo(wSolAccount))
        ixs.push(
            createAssociatedTokenAccountIdempotentInstruction(
                keypair.publicKey,
                wSolAccount,
                keypair.publicKey,
                NATIVE_MINT
            )
        );


    const pumpammPoolReserves: PoolReserves = {
        token0: NATIVE_MINT.toBase58(),
        token1: mintAddress.toBase58(),
        reserveToken0: 84_990_359_074,
        reserveToken1: 206_900_000_000_000
    }
    const { maxQuote } = getBuySwapBase(buyAmount, pumpammPoolReserves, slippage);
    ixs.push(
        SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: wSolAccount,
            lamports: Math.floor(maxQuote),
        }),
        createSyncNativeInstruction(wSolAccount, TOKEN_PROGRAM_ID),
    )

    const tokenAta = getAssociatedTokenAddressSync(mintAddress, keypair.publicKey);
    if (!await solanaConnection.getAccountInfo(tokenAta))
        ixs.push(
            createAssociatedTokenAccountInstruction(
                keypair.publicKey,
                tokenAta,
                keypair.publicKey,
                mintAddress
            )
        );

    const [globalConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(PUMPSWAP_GLOBAL_CONFIG)],
        PUMPSWAP_PROGRAM_ADDR
    );

    const [eventAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from(PUMPSWAP_EVENT_AUTH)],
        PUMPSWAP_PROGRAM_ADDR
    );

    const protocolFeeRecipient = PUMPSWAP_MAINNET_FEE_ADDR[0];
    const protocolFeeRecipientTokenAccount = getAssociatedTokenAddressSync(NATIVE_MINT, protocolFeeRecipient, true);
    const userBaseTokenAccount = getAssociatedTokenAddressSync(mintAddress, keypair.publicKey);
    const userQuoteTokenAccount = getAssociatedTokenAddressSync(NATIVE_MINT, keypair.publicKey);

    const pumpswapBuyIx = createPumpswapBuyIx({
        programId: PUMPSWAP_PROGRAM_ADDR,
        maxQuoteAmountIn: Math.floor(maxQuote),
        baseAmountOut: buyAmount,
        globalConfig,
        eventAuthority,
        protocolFeeRecipient,
        protocolFeeRecipientTokenAccount,
        baseMint: mintAddress,
        quoteMint: NATIVE_MINT,
        pool: poolId,
        poolBaseTokenAccount: pumpammPoolBaseTokenAcc,
        poolQuoteTokenAccount: pumpammPoolQuoteTokenAcc,
        userBaseTokenAccount,
        userQuoteTokenAccount,
        user: keypair.publicKey,
        baseTokenProgram: TOKEN_PROGRAM_ID,
        quoteTokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        coinCreator: coinCreator,
    })

    ixs.push(pumpswapBuyIx)
    ixs.push(createCloseAccountInstruction(
        wSolAccount,
        keypair.publicKey,
        keypair.publicKey,
    ));

    const message = new TransactionMessage({
        payerKey: keypair.publicKey,
        recentBlockhash: (await solanaConnection.getLatestBlockhash()).blockhash,
        instructions: ixs,
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    tx.sign([keypair])

    return { tx, poolId: poolId.toBase58() };
}

function getBuySwapBase(
    quoteAmountOut: number,
    reserve: PoolReserves,
    slippage: number = 0
): { maxQuote: number } {
    let reserveIn: number, reserveOut: number;

    (reserveOut = reserve.reserveToken0), (reserveIn = reserve.reserveToken1);
    const sol_reserve = BigInt(reserveIn);
    const token_reserve = BigInt(reserveOut);

    const product = sol_reserve * token_reserve;

    const slippageFactorFloat = (1 + slippage / 100) * 1_000_000_000;
    const slippageFactor = BigInt(Math.floor(slippageFactorFloat));

    let new_token_reserve = token_reserve - BigInt(quoteAmountOut);
    let new_sol_reserve = product / new_token_reserve;
    let amount_to_be_purchased = new_sol_reserve * BigInt(quoteAmountOut) * BigInt(10025) / BigInt(10000) / BigInt(1_000_000_000) * slippageFactor / BigInt(1_000_000_000);

    return { maxQuote: Number(amount_to_be_purchased) };
}
