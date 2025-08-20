import axios from 'axios';
import { ComputeBudgetConfig } from '@raydium-io/raydium-sdk';
import { sell_remove_fees } from '../config';


interface SolanaFeeInfo {
  min: number;
  max: number;
  avg: number;
  priorityTx: number;
  nonVotes: number;
  priorityRatio: number;
  avgCuPerBlock: number;
  blockspaceUsageRatio: number;
}
type SolanaFeeInfoJson = {
  '1': SolanaFeeInfo;
  '5': SolanaFeeInfo;
  '15': SolanaFeeInfo;
};

export async function getComputeBudgetConfig(): Promise<ComputeBudgetConfig | undefined> {

}


export async function getComputeBudgetConfigHigh(): Promise<ComputeBudgetConfig | undefined> {

}