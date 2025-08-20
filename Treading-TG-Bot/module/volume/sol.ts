import { TOKEN_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { NATIVE_MINT, createAssociatedTokenAccountIdempotentInstruction, createCloseAccountInstruction, createSyncNativeInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { PublicKey, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { ComputeBudgetProgram, Connection, Keypair, Transaction } from "@solana/web3.js"

export class Sol {
    private mainKp: Keypair;
    private connection: Connection;
    constructor(mainKp: Keypair,
        connection: Connection
    ) {
        this.mainKp = mainKp;
        this.connection = connection;
    }
    public wrapSol = async (wsolAmount: number, baseMint: PublicKey) => {
        try {
            const wSolAccount = await getAssociatedTokenAddress(NATIVE_MINT, this.mainKp.publicKey);
            const baseAta = await getAssociatedTokenAddress(baseMint, this.mainKp.publicKey);
            const tx = new Transaction().add(
              ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 461197 }),
              ComputeBudgetProgram.setComputeUnitLimit({ units: 51337 }),
            );
            if (!await this.connection.getAccountInfo(wSolAccount))
              tx.add(
                createAssociatedTokenAccountIdempotentInstruction(
                  this.mainKp.publicKey,
                  wSolAccount,
                  this.mainKp.publicKey,
                  NATIVE_MINT,
                ),
                SystemProgram.transfer({
                  fromPubkey: this.mainKp.publicKey,
                  toPubkey: wSolAccount,
                  lamports: Math.floor(wsolAmount * 10 ** 9),
                }),
                createSyncNativeInstruction(wSolAccount, TOKEN_PROGRAM_ID),
              )
            if (!await this.connection.getAccountInfo(baseAta))
              tx.add(
                createAssociatedTokenAccountIdempotentInstruction(
                  this.mainKp.publicKey,
                  baseAta,
                  this.mainKp.publicKey,
                  baseMint,
                ),
              )
        
            tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
            tx.feePayer = this.mainKp.publicKey
            const sig = await sendAndConfirmTransaction(this.connection, tx, [this.mainKp], { skipPreflight: true, commitment: "confirmed" });
            console.log(`Wrapped SOL transaction: https://solscan.io/tx/${sig}`);
          } catch (error) {
            console.error("wrapSol error:", error);
          }
    }
    public unwrapSol = async () => {
        const wSolAccount = await getAssociatedTokenAddress(NATIVE_MINT, this.mainKp.publicKey);
        try {
            const wsolAccountInfo = await this.connection.getAccountInfo(wSolAccount);
            if (wsolAccountInfo) {
                const tx = new Transaction().add(
                    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 261197 }),
                    ComputeBudgetProgram.setComputeUnitLimit({ units: 101337 }),
                    createCloseAccountInstruction(
                        wSolAccount,
                        this.mainKp.publicKey,
                        this.mainKp.publicKey,
                    ),
                );
                tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash
                tx.feePayer = this.mainKp.publicKey
                const sig = await sendAndConfirmTransaction(this.connection, tx, [this.mainKp], { skipPreflight: true, commitment: "confirmed" });
                console.log(`Unwrapped SOL transaction: https://solscan.io/tx/${sig}`);
            }
        } catch (error) {
            console.error("unwrapSol error:", error);
        }
    }

}