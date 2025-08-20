import * as token from "@solana/spl-token"
import * as web3 from "@solana/web3.js";
import { Buffer } from 'buffer';
import { publicKey, struct, u32, u64, u8, option, vec } from '@project-serum/borsh';
import * as fs from 'fs';

/** Token account state as stored by the program */
export enum AccountState {
    Uninitialized = 0,
    Initialized = 1,
    Frozen = 2,
}

/** Token account as stored by the program */
export interface RawAccount {
    mint: web3.PublicKey;
    owner: web3.PublicKey;
    amount: bigint;
    delegateOption: 1 | 0;
    delegate: web3.PublicKey;
    state: AccountState;
    isNativeOption: 1 | 0;
    isNative: bigint;
    delegatedAmount: bigint;
    closeAuthorityOption: 1 | 0;
    closeAuthority: web3.PublicKey;
}

/** Buffer layout for de/serializing a token account */
export const AccountLayout = struct<RawAccount>([
    publicKey('mint'),
    publicKey('owner'),
    u64('amount'),
    u32('delegateOption'),
    publicKey('delegate'),
    u8('state'),
    u32('isNativeOption'),
    u64('isNative'),
    u64('delegatedAmount'),
    u32('closeAuthorityOption'),
    publicKey('closeAuthority'),
]);

/**
 * Split an array into chunks of specified size
 * @param array - The array to chunk
 * @param chunkSize - The size of each chunk
 * @returns Array of chunks
 */
function chunk<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

/**
 * Load wallet keypair from file
 * @param filePath - Path to the keypair file
 * @returns Keypair object
 */
function loadWalletKeypair(filePath: string): web3.Keypair {
    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const secret = new Uint8Array(JSON.parse(rawData));
        return web3.Keypair.fromSecretKey(secret);
    } catch (error) {
        console.error(`Error loading wallet keypair from ${filePath}:`, error);
        throw new Error(`Failed to load wallet keypair: ${error}`);
    }
}

/**
 * Load mints from JSON file
 * @param filePath - Path to the mints JSON file
 * @returns Array of PublicKeys
 */
function loadMints(filePath: string): web3.PublicKey[] {
    try {
        const mintsData = fs.readFileSync(filePath, 'utf8');
        const mints = JSON.parse(mintsData);
        return mints.map((mint: string) => new web3.PublicKey(mint));
    } catch (error) {
        console.error(`Error loading mints from ${filePath}:`, error);
        throw new Error(`Failed to load mints: ${error}`);
    }
}

/**
 * Generate Associated Token Account addresses for given mints
 * @param owner - Owner public key
 * @param mints - Array of mint public keys
 * @returns Array of ATA public keys
 */
async function generateATAs(owner: web3.PublicKey, mints: web3.PublicKey[]): Promise<web3.PublicKey[]> {
    return Promise.all(mints.map(async (mint) => {
        const [ataPk] = await web3.PublicKey.findProgramAddress(
            [owner.toBuffer(), token.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
            token.ASSOCIATED_TOKEN_PROGRAM_ID
        );
        return ataPk;
    }));
}

/**
 * Process account data and display balance information
 * @param accountData - Account data from RPC
 * @param mint - Mint public key for display
 */
function processAccountData(accountData: web3.AccountInfo<Buffer> | null, mint: web3.PublicKey): void {
    if (!accountData) {
        console.log(`mint: ${mint.toString()}, balance: 0 (account not found)`);
        return;
    }

    try {
        const tokenAccount: token.AccountInfo = AccountLayout.decode(accountData.data);
        const balance = new token.u64(tokenAccount.amount);
        const mintKey = new web3.PublicKey(tokenAccount.mint);

        if (balance.gt(new token.u64(0))) {
            console.log(`✅ mint: ${mintKey.toString()}, balance: ${balance.toString()}`);
        } else {
            console.log(`❌ mint: ${mintKey.toString()}, balance: ${balance.toString()}`);
        }
    } catch (error) {
        console.error(`Error processing account data for mint ${mint.toString()}:`, error);
        console.log(`⚠️  mint: ${mint.toString()}, balance: ERROR (invalid account data)`);
    }
}

/**
 * Main function to check ATA balances
 */
async function main(): Promise<void> {
    try {
        console.log('🔍 Starting ATA balance check...\n');

        // Initialize connection
        const connection = new web3.Connection("http://127.0.0.1:8899");
        console.log('📡 Connected to local validator');

        // Load wallet and mints
        const owner = loadWalletKeypair('./localnet_owner.key');
        const myPubkey = owner.publicKey;
        console.log(`👤 Wallet: ${myPubkey.toString()}`);

        const mints = loadMints("saved_mints.json");
        console.log(`📊 Loaded ${mints.length} mints\n`);

        // Generate ATA addresses
        console.log('🔧 Generating Associated Token Account addresses...');
        const ataPks = await generateATAs(myPubkey, mints);
        console.log(`✅ Generated ${ataPks.length} ATA addresses\n`);

        let count = 0;
        const chunkSize = 99; // RPC limit for getMultipleAccountsInfo

        // Process accounts in chunks
        for (let i = 0; i < ataPks.length; i += chunkSize) {
            const pkChunk = ataPks.slice(i, i + chunkSize);
            console.log(`📦 Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(ataPks.length / chunkSize)}`);

            try {
                const accData = await connection.getMultipleAccountsInfo(pkChunk);
                
                accData.forEach((accountData, index) => {
                    const mint = mints[i + index];
                    processAccountData(accountData, mint);
                    
                    if (accountData) {
                        try {
                            const tokenAccount: token.AccountInfo = AccountLayout.decode(accountData.data);
                            const balance = new token.u64(tokenAccount.amount);
                            if (balance.gt(new token.u64(0))) {
                                count++;
                            }
                        } catch (error) {
                            // Skip invalid accounts
                        }
                    }
                });
            } catch (error) {
                console.error(`Error fetching account data for chunk ${Math.floor(i / chunkSize) + 1}:`, error);
            }
        }
        
        console.log('\n📈 Summary:');
        console.log(`Total ATAs: ${ataPks.length}`);
        console.log(`Non-zero balances: ${count}`);
        console.log(`Zero/Invalid balances: ${ataPks.length - count}`);
        
        // Note about DOGE token
        console.log('\n💡 Note: DOGE token may be missing due to quote errors, which is expected behavior.');
        
    } catch (error) {
        console.error('❌ Error in main function:', error);
        process.exit(1);
    }
}

// Run the main function
main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});