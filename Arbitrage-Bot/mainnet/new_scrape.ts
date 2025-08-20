import * as token from "@solana/spl-token"
import * as web3 from "@solana/web3.js";
import { Buffer } from 'buffer';
import BN from 'bn.js';
import * as fs from 'fs';

/**
 * Read directory names from a given directory
 */
async function readDirNames(dirName: string): Promise<string[]> {
    try {
        const dir = fs.opendirSync(dirName);
        const dirs: string[] = [];
        let dirent;
        
        while ((dirent = dir.readSync()) !== null) {
            dirs.push(dirent.name);
        }
        
        dir.closeSync();
        return dirs;
    } catch (error) {
        console.error(`Error reading directory ${dirName}:`, error);
        return [];
    }
}

/**
 * Split array into chunks of specified size
 */
function chunk<T>(array: T[], chunkSize: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

import { publicKey, struct, u32, u64, u8, option, vec } from '@project-serum/borsh';

// Account layout for SPL tokens
export const AccountLayout = struct<token.AccountInfo>([
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

async function main() {    
    console.log("Starting Solana arbitrage bot setup...");
    
    // Initialize connection to Solana network
    const connection = new web3.Connection("https://ssc-dao.genesysgo.net");
    const programs: string[] = [];
    const accounts: string[] = [];
    const mints: string[] = [];

    try {
        // ORCA POOL SETUP 
        console.log("Setting up Orca pools...");
        const orcaPid = "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP";
        programs.push(orcaPid);

        const orcaPools = "../pools/orca/";
        const orcaPoolNames: string[] = await readDirNames(orcaPools);
        let orcaCount = 0;
        
        for (const name of orcaPoolNames) {
            try {
                const pool = JSON.parse(fs.readFileSync(orcaPools + name, 'utf8'));
                orcaCount++;
                
                pool.tokenIds.forEach((mintId: string) => {
                    accounts.push(pool.tokens[mintId].addr);
                    mints.push(mintId);
                });
                
                accounts.push(pool.address);
                accounts.push(pool.poolTokenMint);
                accounts.push(pool.feeAccount);
            } catch (error) {
                console.warn(`Error processing Orca pool ${name}:`, error);
            }
        }
        
        const progAccs = await connection.getProgramAccounts(new web3.PublicKey(orcaPid));
        progAccs.forEach(v => {
            accounts.push(v.pubkey.toString());
            orcaCount++;
        });
        
        console.log("Orca count:", orcaCount);

        // MERCURIAL POOL SETUP 
        console.log("Setting up Mercurial pools...");
        const mercurialPid = "MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky";
        programs.push(mercurialPid);
        
        const mercurialPools = "../pools/mercurial/";
        const mercurialPoolNames: string[] = await readDirNames(mercurialPools);
        let mercurialCount = 0;
        
        for (const name of mercurialPoolNames) {
            try {
                const pool = JSON.parse(fs.readFileSync(mercurialPools + name, 'utf8'));
                mercurialCount++;
                
                accounts.push(pool.pool_account);
                pool.token_ids.forEach((mintId: string) => {
                    accounts.push(pool.tokens[mintId].addr);
                    mints.push(mintId);
                });
            } catch (error) {
                console.warn(`Error processing Mercurial pool ${name}:`, error);
            }
        }
        
        console.log("Mercurial count:", mercurialCount);

        // SABER POOL SETUP 
        console.log("Setting up Saber pools...");
        const saberPid = "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ";
        programs.push(saberPid);
        
        const saberPools = "../pools/saber/";
        const saberPoolNames = await readDirNames(saberPools);
        let saberCount = 0;
        
        for (const name of saberPoolNames) {
            try {
                const pool = JSON.parse(fs.readFileSync(saberPools + name, 'utf8'));
                saberCount++;
                
                accounts.push(pool.pool_account);
                accounts.push(pool.pool_token_mint);

                pool.token_ids.forEach((mintId: string) => {
                    accounts.push(pool.tokens[mintId].addr);
                    accounts.push(pool.fee_accounts[mintId]);
                    mints.push(mintId);
                });
            } catch (error) {
                console.warn(`Error processing Saber pool ${name}:`, error);
            }
        }
        
        console.log("Saber count:", saberCount);

        // ALDRIN POOL SETUP
        console.log("Setting up Aldrin pools...");
        const aldrinV1 = "AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6";
        programs.push(aldrinV1);
        
        const aldrinV2 = "CURVGoZn8zycx6FXwwevgBTB2gVvdbGTEpvMJDbgs2t4";
        programs.push(aldrinV2);
        
        const aldrinPools = "../pools/aldrin/";
        const aldrinPoolNames = await readDirNames(aldrinPools);
        let aldrinCount = 0;
        
        for (const name of aldrinPoolNames) {
            try {
                const pool = JSON.parse(fs.readFileSync(aldrinPools + name, 'utf8'));
                aldrinCount++;
                
                accounts.push(pool.poolPublicKey);
                accounts.push(pool.poolMint);
                accounts.push(pool.feePoolTokenAccount);
                accounts.push(pool.feeBaseAccount);
                accounts.push(pool.feeQuoteAccount);
                accounts.push(pool.lpTokenFreezeVault);

                if (pool.poolVersion == 2) {
                    accounts.push(pool.curve);
                }

                pool.tokenIds.forEach((mintId: string) => {
                    accounts.push(pool.tokens[mintId].addr);
                    mints.push(mintId);
                });
            } catch (error) {
                console.warn(`Error processing Aldrin pool ${name}:`, error);
            }
        }
        
        console.log("Aldrin count:", aldrinCount);

        // SERUM AMM SETUP
        console.log("Setting up Serum pools...");
        const serumPid = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";
        programs.push(serumPid);

        const serumPools = "../pools/serum/"; 
        const serumPoolNames = await readDirNames(serumPools);
        let serumCount = 0;
        
        for (const name of serumPoolNames) {
            try {
                const pool = JSON.parse(fs.readFileSync(serumPools + name, 'utf8'));
                serumCount++;
            
                accounts.push(pool.ownAddress);
                accounts.push(pool.requestQueue);    
                accounts.push(pool.bids);
                accounts.push(pool.asks);
                accounts.push(pool.baseVault);
                accounts.push(pool.quoteVault);
                accounts.push(pool.eventQueue);
            
                mints.push(pool.baseMint);
                mints.push(pool.quoteMint);
            } catch (error) {
                console.warn(`Error processing Serum pool ${name}:`, error);
            }
        }
        
        console.log("Serum count:", serumCount);

        // Fee-based not swapable
        const other = "MSRMcoVyrFxnSgo5uXwone5SKcGhT1KEJMFEkMEWf9L";
        accounts.push(other);

        // Remove duplicates 
        const uniqueAccounts = [...new Set(accounts)];
        const uniquePrograms = [...new Set(programs)];
        const uniqueMints = [...new Set(mints)];

        console.log("Saving programs:", uniquePrograms.length);
        console.log("Saving accounts:", uniqueAccounts.length);
        console.log("Mints:", uniqueMints.length);

        // Save mints 
        fs.writeFileSync(`saved_mints.json`, JSON.stringify(uniqueMints, null, 2), 'utf8');

        // Generate new owner keypair for testing
        const owner = web3.Keypair.generate();
        console.log('Owner public key:', owner.publicKey.toString());
        
        // Save secret key
        fs.writeFileSync(`localnet_owner.key`, "[" + owner.secretKey.toString() + "]", 'utf8');

        // Scrape accounts
        console.log("Scraping accounts...");
        let n = 0;
        
        for (const accChunk of chunk(uniqueAccounts, 99)) {
            console.log(`${99 * n} / ${uniqueAccounts.length}`);
            n++;
            
            try {
                const infos = await connection.getMultipleAccountsInfo(
                    accChunk.map(s => new web3.PublicKey(s))
                );
                
                for (let i = 0; i < infos.length; i++) {
                    const pk = accChunk[i];
                    const info = infos[i];
                    
                    if (!info) {
                        console.warn(`No info for account ${pk}`);
                        continue;
                    }
                    
                    const notypeInfo = JSON.parse(JSON.stringify(info, null, "\t"));
                    notypeInfo.data = [info.data.toString("base64"), "base64"];

                    const localValidatorAcc = {
                        account: notypeInfo, 
                        pubkey: pk,
                    };
                    
                    const path = `accounts/${pk}.json`; 
                    fs.writeFileSync(path, JSON.stringify(localValidatorAcc, null, 2), 'utf8');
                }
            } catch (error) {
                console.error(`Error processing account chunk ${n}:`, error);
            }
        }

        fs.writeFileSync(`programs.json`, JSON.stringify(uniquePrograms, null, 2), 'utf8');

        // Scrape mints
        console.log("Scraping mints...");
        for (const mintChunk of chunk(uniqueMints, 99)) {
            try {
                const infos = await connection.getMultipleAccountsInfo(
                    mintChunk.map(s => new web3.PublicKey(s))
                );
                
                for (let i = 0; i < infos.length; i++) {
                    const pk = mintChunk[i];
                    const info = infos[i];
                    
                    if (!info) {
                        console.warn(`No info for mint ${pk}`);
                        continue;
                    }
                    
                    try {
                        const mint = token.MintLayout.decode(info.data);
                        mint.mintAuthority = owner.publicKey.toBuffer(); // Allow minting for testing
                        mint.mintAuthorityOption = 1;
                        
                        const data = Buffer.alloc(token.MintLayout.span);
                        token.MintLayout.encode(mint, data);

                        const notypeInfo = JSON.parse(JSON.stringify(info, null, "\t"));
                        notypeInfo.data = [data.toString("base64"), "base64"];
                        
                        const localValidatorAcc = {
                            account: notypeInfo, 
                            pubkey: pk,
                        };
                        
                        const path = `accounts/${pk}.json`; 
                        fs.writeFileSync(path, JSON.stringify(localValidatorAcc, null, 2), 'utf8');
                    } catch (error) {
                        console.warn(`Error processing mint ${pk}:`, error);
                    }
                }
            } catch (error) {
                console.error(`Error processing mint chunk:`, error);
            }
        }

        console.log("Setup completed successfully!");
        
    } catch (error) {
        console.error("Error during setup:", error);
        process.exit(1);
    }
}

// Run the main function
main().catch(console.error);