import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";

export abstract class IDexReadAdapter {
  abstract getPoolKeys(poolAddress: string): any;
  abstract getPrice(): number;
  abstract getSwapQuote(inputAmount: number, inputMint: string): number | { amountOut: number, remainingAccount: PublicKey[] };
  abstract getSwapInstruction(amountIn: number, minAmountOut: number, swapAccountkey: any): TransactionInstruction;
}