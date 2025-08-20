
import {
  PublicKey,
  Keypair,
  VersionedTransaction,
} from '@solana/web3.js';
import { SLIPPAGE } from '../constants';

export const getBuyTxWithJupiter = async (wallet: Keypair, baseMint: PublicKey, amount: number) => {
  try {
   
  } catch (error) {
    console.log("Failed to get buy transaction")
    return null
  }
};


export const getSellTxWithJupiter = async (wallet: Keypair, baseMint: PublicKey, amount: string) => {
  try {
    
  } catch (error) {
    console.log("Failed to get sell transaction")
    return null
  }
};