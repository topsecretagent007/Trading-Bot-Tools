import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { PUMPFUN_POOL_AUTH } from "./constants/pumpfun";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createSyncNativeInstruction, createAssociatedTokenAccountInstruction, createCloseAccountInstruction } from "@solana/spl-token";
import { NATIVE_MINT } from "@solana/spl-token";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { connection as solanaConnection, PUMPFUN_PROGRAM_ID, PUMPSWAP_PROGRAM_ADDR } from "./constants/constants";
import { PoolReserves } from "./src/pumpswap/types";
import { PUMPSWAP_EVENT_AUTH, PUMPSWAP_GLOBAL_CONFIG, PUMPSWAP_MAINNET_FEE_ADDR, PUMPSWAP_POOL } from "./constants/pumpswap";
import { createPumpswapBuyIx } from "./src/pumpswap/instructions";

export const getBuyTx = async (mintAddress: PublicKey, coinCreator: PublicKey, wallets: Keypair[], buyAmounts: number[], slippage: number) => {
    const ixs: TransactionInstruction[] = []

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

    const pumpammPoolReserves: PoolReserves = {
        token0: NATIVE_MINT.toBase58(),
        token1: mintAddress.toBase58(),
        reserveToken0: 84_990_359_074,
        reserveToken1: 206_900_000_000_000
    }

    // Process each wallet
    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const buyAmount = buyAmounts[i] * LAMPORTS_PER_SOL;

        // Create wSol account for this wallet if it doesn't exist
        const wSolAccount = getAssociatedTokenAddressSync(NATIVE_MINT, wallet.publicKey);
        if (!await solanaConnection.getAccountInfo(wSolAccount))
            ixs.push(
                createAssociatedTokenAccountIdempotentInstruction(
                    wallet.publicKey,
                    wSolAccount,
                    wallet.publicKey,
                    NATIVE_MINT
                )
            );

        // Calculate max quote amount for this wallet
        const { maxQuote } = getBuySwapBase(buyAmount, pumpammPoolReserves, slippage);

        // Add transfer and sync native instructions for this wallet
        ixs.push(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: wSolAccount,
                lamports: Math.floor(maxQuote),
            }),
            createSyncNativeInstruction(wSolAccount, TOKEN_PROGRAM_ID),
        )

        // Create token ATA for this wallet if it doesn't exist
        const tokenAta = getAssociatedTokenAddressSync(mintAddress, wallet.publicKey);
        if (!await solanaConnection.getAccountInfo(tokenAta))
            ixs.push(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    tokenAta,
                    wallet.publicKey,
                    mintAddress
                )
            );

        const userBaseTokenAccount = getAssociatedTokenAddressSync(mintAddress, wallet.publicKey);
        const userQuoteTokenAccount = getAssociatedTokenAddressSync(NATIVE_MINT, wallet.publicKey);

        // Create pumpswap buy instruction for this wallet
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
            user: wallet.publicKey,
            baseTokenProgram: TOKEN_PROGRAM_ID,
            quoteTokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            coinCreator: coinCreator,
        })

        // Add pumpswap buy instruction and close account instruction for this wallet
        ixs.push(pumpswapBuyIx)
        ixs.push(createCloseAccountInstruction(
            wSolAccount,
            wallet.publicKey,
            wallet.publicKey,
        ));
    }

    const message = new TransactionMessage({
        payerKey: wallets[0].publicKey,
        recentBlockhash: (await solanaConnection.getLatestBlockhash()).blockhash,
        instructions: ixs,
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    tx.sign(wallets)

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
