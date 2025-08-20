import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
    PublicKey,
    TransactionInstruction,
    AccountMeta,
} from "@solana/web3.js";

export function createPumpswapBuyIx({
    programId,
    pool,
    user,
    globalConfig,
    baseMint,
    quoteMint,
    userBaseTokenAccount,
    userQuoteTokenAccount,
    poolBaseTokenAccount,
    poolQuoteTokenAccount,
    protocolFeeRecipient,
    protocolFeeRecipientTokenAccount,
    baseTokenProgram,
    quoteTokenProgram,
    systemProgram,
    associatedTokenProgram,
    eventAuthority,
    baseAmountOut,
    maxQuoteAmountIn,
    coinCreator
}: {
    programId: PublicKey;
    pool: PublicKey;
    user: PublicKey;
    globalConfig: PublicKey;
    baseMint: PublicKey;
    quoteMint: PublicKey;
    userBaseTokenAccount: PublicKey;
    userQuoteTokenAccount: PublicKey;
    poolBaseTokenAccount: PublicKey;
    poolQuoteTokenAccount: PublicKey;
    protocolFeeRecipient: PublicKey;
    protocolFeeRecipientTokenAccount: PublicKey;
    baseTokenProgram: PublicKey;
    quoteTokenProgram: PublicKey;
    systemProgram: PublicKey;
    associatedTokenProgram: PublicKey;
    eventAuthority: PublicKey;
    baseAmountOut: number | bigint;
    maxQuoteAmountIn: number | bigint;
    coinCreator: PublicKey
}): TransactionInstruction {
    const discriminator = Buffer.from([102, 6, 61, 18, 1, 218, 235, 234]);
    const baseOut = Buffer.alloc(8);
    const maxQuoteIn = Buffer.alloc(8);
    baseOut.writeBigUInt64LE(BigInt(baseAmountOut));
    maxQuoteIn.writeBigUInt64LE(BigInt(maxQuoteAmountIn));
    const data = Buffer.concat([discriminator, baseOut, maxQuoteIn]);

    const vault_auth_seeds = [
        Buffer.from("creator_vault"),
        Buffer.from(coinCreator.toBuffer())
    ];

    // 2. Find PDA
    const [vault_auth_pda] = PublicKey.findProgramAddressSync(
        vault_auth_seeds,
        programId
    );



    // 3. Get ATA
    const vault_ata = getAssociatedTokenAddressSync(
        quoteMint,
        vault_auth_pda,
        true
    );

    const keys: AccountMeta[] = [
        { pubkey: pool, isSigner: false, isWritable: false },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: globalConfig, isSigner: false, isWritable: false },
        { pubkey: baseMint, isSigner: false, isWritable: false },
        { pubkey: quoteMint, isSigner: false, isWritable: false },
        { pubkey: userBaseTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userQuoteTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolBaseTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolQuoteTokenAccount, isSigner: false, isWritable: true },
        { pubkey: protocolFeeRecipient, isSigner: false, isWritable: false },
        { pubkey: protocolFeeRecipientTokenAccount, isSigner: false, isWritable: true },
        { pubkey: baseTokenProgram, isSigner: false, isWritable: false },
        { pubkey: quoteTokenProgram, isSigner: false, isWritable: false },
        { pubkey: systemProgram, isSigner: false, isWritable: false },
        { pubkey: associatedTokenProgram, isSigner: false, isWritable: false },
        { pubkey: eventAuthority, isSigner: false, isWritable: false },
        { pubkey: programId, isSigner: false, isWritable: false },
        { pubkey: vault_ata, isSigner: false, isWritable: true },
        { pubkey: vault_auth_pda, isSigner: false, isWritable: false }
    ];

    return new TransactionInstruction({
        programId,
        keys,
        data,
    });
}


export function createPumpswapSellIx({
    programId,
    pool,
    user,
    globalConfig,
    baseMint,
    quoteMint,
    userBaseTokenAccount,
    userQuoteTokenAccount,
    poolBaseTokenAccount,
    poolQuoteTokenAccount,
    protocolFeeRecipient,
    protocolFeeRecipientTokenAccount,
    baseTokenProgram,
    quoteTokenProgram,
    systemProgram,
    associatedTokenProgram,
    eventAuthority,
    baseAmountIn,
    minQuoteAmountOut,
    coinCreator,
}: {
    programId: PublicKey;
    pool: PublicKey;
    user: PublicKey;
    globalConfig: PublicKey;
    baseMint: PublicKey;
    quoteMint: PublicKey;
    userBaseTokenAccount: PublicKey;
    userQuoteTokenAccount: PublicKey;
    poolBaseTokenAccount: PublicKey;
    poolQuoteTokenAccount: PublicKey;
    protocolFeeRecipient: PublicKey;
    protocolFeeRecipientTokenAccount: PublicKey;
    baseTokenProgram: PublicKey;
    quoteTokenProgram: PublicKey;
    systemProgram: PublicKey;
    associatedTokenProgram: PublicKey;
    eventAuthority: PublicKey;
    baseAmountIn: number | bigint;
    minQuoteAmountOut: number | bigint;
    coinCreator: PublicKey,
}): TransactionInstruction {
    const discriminator = Buffer.from([51, 230, 133, 164, 1, 127, 131, 173]);
    const baseIn = Buffer.alloc(8);
    const minQuoteOut = Buffer.alloc(8);
    baseIn.writeBigUInt64LE(BigInt(baseAmountIn));
    minQuoteOut.writeBigUInt64LE(BigInt(minQuoteAmountOut));
    const data = Buffer.concat([discriminator, baseIn, minQuoteOut]);

    const vault_auth_seeds = [
        Buffer.from("creator_vault"),
        Buffer.from(coinCreator.toBuffer())
    ];

    // 2. Find PDA
    const [vault_auth_pda] = PublicKey.findProgramAddressSync(
        vault_auth_seeds,
        programId
    );

    // 3. Get ATA
    const vault_ata = getAssociatedTokenAddressSync(
        quoteMint,
        vault_auth_pda,
        true
    );

    const keys: AccountMeta[] = [
        { pubkey: pool, isSigner: false, isWritable: false },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: globalConfig, isSigner: false, isWritable: false },
        { pubkey: baseMint, isSigner: false, isWritable: false },
        { pubkey: quoteMint, isSigner: false, isWritable: false },
        { pubkey: userBaseTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userQuoteTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolBaseTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolQuoteTokenAccount, isSigner: false, isWritable: true },
        { pubkey: protocolFeeRecipient, isSigner: false, isWritable: false },
        { pubkey: protocolFeeRecipientTokenAccount, isSigner: false, isWritable: true },
        { pubkey: baseTokenProgram, isSigner: false, isWritable: false },
        { pubkey: quoteTokenProgram, isSigner: false, isWritable: false },
        { pubkey: systemProgram, isSigner: false, isWritable: false },
        { pubkey: associatedTokenProgram, isSigner: false, isWritable: false },
        { pubkey: eventAuthority, isSigner: false, isWritable: false },
        { pubkey: programId, isSigner: false, isWritable: false },
        { pubkey: vault_ata, isSigner: false, isWritable: true },
        { pubkey: vault_auth_pda, isSigner: false, isWritable: false }
    ];

    return new TransactionInstruction({
        programId,
        keys,
        data,
    });
}
