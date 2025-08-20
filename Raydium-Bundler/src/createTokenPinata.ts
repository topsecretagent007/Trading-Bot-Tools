import { Keypair, PublicKey, SystemProgram, Transaction, ComputeBudgetProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import {
    createAssociatedTokenAccountInstruction, createInitializeMintInstruction, createMintToInstruction,
    getAssociatedTokenAddress, getMinimumBalanceForRentExemptMint, MintLayout, TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { PROGRAM_ID, DataV2, createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import axios from 'axios';
import FormData from 'form-data';
import base58 from 'bs58';
import fs from 'fs';
import { BN } from 'bn.js';
import { cluster, connection, pinataApiKey, pinataSecretApiKey } from '../config';
import { Metadata, UserToken } from "./types"
import { readJson } from './utils';

const uploadToIPFS = async (filePath: string) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const data = new FormData();

    data.append('file', fs.createReadStream(filePath));

    const res = await axios.post(url, data, {
        maxContentLength: Infinity,
        headers: {
            'Content-Type': `multipart/form-data; boundary=${data.getBoundary()}`,
            'pinata_api_key': pinataApiKey,
            'pinata_secret_api_key': pinataSecretApiKey
        }
    });

    return res.data.IpfsHash;
};

const uploadMetadata = async (metadata: object) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

    const res = await axios.post(url, metadata, {
        headers: {
            'pinata_api_key': pinataApiKey,
            'pinata_secret_api_key': pinataSecretApiKey
        }
    });

    return res.data.IpfsHash;
};

const data = readJson()

export const createTokenWithMetadata = async (token: UserToken) => {
    try {

    } catch (error) {
        console.log("Create token error: ", error)
        return
    }
};
