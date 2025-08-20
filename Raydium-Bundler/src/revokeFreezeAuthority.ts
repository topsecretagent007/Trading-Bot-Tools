import { AuthorityType, createSetAuthorityInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey, Transaction, Keypair, ComputeBudgetProgram } from '@solana/web3.js';
import bs58 from 'bs58'
import { PoolInfo } from './types';
import { readJson, securityCheckWaiting, sleep } from './utils';
import { cluster, connection } from '../config';
import { sendAndConfirmTransaction } from '@solana/web3.js';
import { init, security_checks } from '..';

export const revokeFreezeAuthority = async () => {
    let params: PoolInfo
    try {
        
    } catch (error) {
        console.log("Error happened in one of the token flow", error)
    }
}

// revokeFreezeAuthority();