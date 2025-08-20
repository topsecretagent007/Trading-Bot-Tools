import BN from 'bn.js'
import { Connection, Keypair, VersionedTransaction, TransactionMessage, ComputeBudgetProgram, PublicKey, SystemProgram } from '@solana/web3.js'
import {
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction
} from '@solana/spl-token'
import { BAGS_FM_PROGRAM_ID, BAGS_FM_AUTHORITY, DEFAULT_TRADE_AMOUNT, MAX_TRANSACTION_SIZE, COMPUTE_UNIT_PRICE, COMPUTE_UNIT_LIMIT } from '../constants/constants'
import { createBuyersAta } from './createAta'

// Bags.fm specific instruction types
const BAGS_FM_INSTRUCTIONS = {
  BUY: 0,
  SELL: 1,
  CREATE_POOL: 2,
  ADD_LIQUIDITY: 3,
  REMOVE_LIQUIDITY: 4
} as const;

export const makeBuyTx = async (connection: Connection, mint: Keypair, buyerKps: Keypair[], lookupTableAddress: PublicKey) => {
  console.log("🚀 Starting Bags.fm buy transaction creation...");
  console.log("🚀 ~ makeBuyTx ~ buyerKps:", buyerKps);

  try {
    const lookupTableAccount = (await connection.getAddressLookupTable(lookupTableAddress)).value;
    if (!lookupTableAccount) {
      throw new Error("Lookup table not found");
    }

    const buyTxs: VersionedTransaction[] = [];
    // Reduce batch size to keep transaction size under limit
    const batchSize = 2;

    for (let i = 0; i < buyerKps.length; i += batchSize) {
      const buyInstruction = [
        // Optimize compute budget for Bags.fm
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: COMPUTE_UNIT_PRICE }),
        ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT })
      ];

      buyTxs.push(tx);

      // Simulate transaction
      try {
        const simResult = await connection.simulateTransaction(tx);
        console.log(`Simulation result for batch ${Math.floor(i / batchSize) + 1}:`, simResult.value.err || "Success");

        if (simResult.value.err) {
          console.error(`Simulation failed for batch ${Math.floor(i / batchSize) + 1}:`, simResult.value.err);
        }
      } catch (err) {
        console.error(`Simulation error for batch ${Math.floor(i / batchSize) + 1}:`, err);
        throw err;
      }
    }

    console.log(`✅ Successfully created ${buyTxs.length} buy transactions`);
    return { transactions: buyTxs };
  } catch (err) {
    console.error("❌ Error in makeBuyTx:", err);
    throw err;
  }
}

// Create Bags.fm buy instruction
function createBagsFmBuyInstruction(
  buyer: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey,
  userTokenAccountA: PublicKey,
  userTokenAccountB: PublicKey,
  amountB: BN
) {
  // This is a placeholder for the actual Bags.fm buy instruction
  // You'll need to implement the actual instruction data based on Bags.fm's program
  const instructionData = Buffer.alloc(1 + 8); // 1 byte for instruction + 8 bytes for amount
  instructionData.writeUint8(BAGS_FM_INSTRUCTIONS.BUY, 0);
  amountB.toArray('le', 8).copy(instructionData, 1);

  return {
    programId: new PublicKey(BAGS_FM_PROGRAM_ID),
    keys: [
      { pubkey: buyer, isSigner: true, isWritable: true },
      { pubkey: mintA, isSigner: false, isWritable: true },
      { pubkey: mintB, isSigner: false, isWritable: true },
      { pubkey: userTokenAccountA, isSigner: false, isWritable: true },
      { pubkey: userTokenAccountB, isSigner: false, isWritable: true },
      { pubkey: new PublicKey(BAGS_FM_AUTHORITY), isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData
  };
}
