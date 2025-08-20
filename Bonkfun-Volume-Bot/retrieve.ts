import { Keypair, PublicKey, LAMPORTS_PER_SOL, TransactionMessage, SystemProgram, VersionedTransaction, TransactionInstruction, Blockhash } from "@solana/web3.js";
import { connection, wallet, tipAcct, isMainnet, provider } from "../config";
import * as spl from "@solana/spl-token";
import fs from "fs";
import path from "path";
import promptSync from "prompt-sync";
import chalk from "chalk";
import { retryOperation, pause } from "./clients/utils";
import { burnAccount, getSwapInstruction, sell } from "./utils";

import { sendBundle, sendTransactionsSequentially } from "./bot";
import { ComputeBudgetProgram } from "@solana/web3.js";
require("dotenv").config();

const DEBUG = process.env.DEBUG?.toLowerCase() === "true";

const prompt = promptSync();
const keypairsDir = "./src/keypairs";

export async function closeAcc() {
	console.clear();
	console.log(chalk.red("\n==================== Retrieve SOL ===================="));
	console.log(chalk.yellow("Follow the instructions below to retrieve SOL.\n"));

	const tokenMint = prompt(chalk.cyan("Enter your Token Mint: "));
	// const tokenMint = "2bvTCZrV2wm5sDj2KENEbERzAXo3w499cVB9wDbXbonk";
	const keypairsPath = path.join(keypairsDir, tokenMint);

	const delaySell = prompt(chalk.cyan("Delay between sells in MS (Ex. 300): "));
	// const delaySell = "3";
	const delaySellIn = parseInt(delaySell, 10);

	if (!fs.existsSync(keypairsPath)) {
		console.log(chalk.red(`No keypairs found for Pair ID/Token: ${tokenMint}`));
		process.exit(0);
	}

	// const jitoTipAmtInput = prompt(chalk.cyan("Jito tip in Sol (Ex. 0.01): "));
	const jitoTipAmtInput = "0.0001";
	const jitoTipAmt = parseFloat(jitoTipAmtInput) * LAMPORTS_PER_SOL;

	if (jitoTipAmtInput) {
		const tipValue = parseFloat(jitoTipAmtInput);
		if (tipValue >= 0.1) {
			console.log(chalk.red("Error: Tip value is too high. Please enter a value less than or equal to 0.1."));
			process.exit(0);
		}
	} else {
		console.log(chalk.red("Error: Invalid input. Please enter a valid number."));
		process.exit(0);
	}

	// Try to interpret marketID as both a pool ID and a token mint
	const tokenKey = new PublicKey(tokenMint);

	// Now proceed with closing all keypairs in this directory
	let keypairsExist = checkKeypairsExist(keypairsPath);

	while (keypairsExist) {
		const keypairs = loadKeypairs(keypairsPath);
		let txsSigned: VersionedTransaction[] = [];
		let maxSize = 0;

		for (let i = 0; i < keypairs.length; i++) {
			let { blockhash } = await retryOperation(() => connection.getLatestBlockhash());

			const keypair = keypairs[i];
			console.log(chalk.blue(`Processing keypair ${i + 1}/${keypairs.length}:`), keypair.publicKey.toString());

			let instructionsForChunk: TransactionInstruction[] = [];
			const tokenAcc = await spl.getAssociatedTokenAddress(tokenKey, keypair.publicKey);
			const wsolAcc = await spl.getAssociatedTokenAddress(spl.NATIVE_MINT, keypair.publicKey);

			// Verify token account exists and has balance
			let tokenAccountExists = false;
			let tokenAmount = 0;
			let tokenAmountString = "0";

			try {
				const accountInfo = await connection.getAccountInfo(tokenAcc);
				if (accountInfo !== null) {
					const balanceResponse = await connection.getTokenAccountBalance(tokenAcc);
					tokenAmount = balanceResponse.value.uiAmount || 0;
					console.log("tokenAmount:", tokenAmount);
					
					tokenAmountString = balanceResponse.value.uiAmountString || "0";
					tokenAccountExists = accountInfo !== null && tokenAmount > 0;

					console.log(chalk.blue(`Token account exists: ${tokenAccountExists}`));
					console.log(chalk.blue(`Token balance: ${tokenAmountString} (${tokenAmount})`));
				} else {
					console.log(chalk.yellow("Token account doesn't exist"));
				}
			} catch (error) {
				console.log(chalk.red(`Error checking token account: ${error}`));
			}

			const wsolAccountExists = await checkTokenAccountExists(wsolAcc);

			// Check if the keypair account has any SOL balance
			const solBalance = await connection.getBalance(keypair.publicKey);
			const minBalanceForRent = 10000; // Minimum balance to be worth transferring

			// Only proceed if either token account exists with balance or WSOL account exists or SOL balance > minimum
			if (tokenAccountExists || wsolAccountExists || solBalance > minBalanceForRent) {
				if (solBalance > minBalanceForRent) {
					console.log(chalk.green(`Account has ${solBalance / LAMPORTS_PER_SOL} SOL, will transfer to main wallet`));
				}

				if (tokenAccountExists) {
					const swapAccountKey = {
						inputMint : tokenKey,
						payer : keypair.publicKey
					}
					const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
						units: 200000000,
					});
					const modifyComputeFee = ComputeBudgetProgram.setComputeUnitPrice({
						microLamports: 10000,
					});
					instructionsForChunk = [modifyComputeUnits, modifyComputeFee]
					// Sell instructions
					const sellInstruction = await getSwapInstruction(tokenAmount, 0, swapAccountKey, tokenKey);

					if (sellInstruction && tokenAmount > 0) {
						instructionsForChunk.push(sellInstruction);
						console.log(chalk.green(`Added Bonk.fun token sell instructions for ${tokenAmountString} tokens`));
					}

					// Burn token account
					let baseTokenBurnInstruction = spl.createCloseAccountInstruction(tokenAcc, wallet.publicKey, keypair.publicKey);
					instructionsForChunk.push(baseTokenBurnInstruction);
				}

				if (wsolAccountExists) {
					console.log("Supposed to burn WSOL entry.");
					// Burn WSOL account
					let wsolBurnInstruction = spl.createCloseAccountInstruction(wsolAcc, wallet.publicKey, keypair.publicKey);
					instructionsForChunk.push(wsolBurnInstruction);
				}

				// Drain leftover SOL from the ephemeral keypair to main wallet
				const balance = await connection.getBalance(keypair.publicKey);
				const feeEstimate = 10000;
				const transferAmount = balance - feeEstimate > 0 ? balance - feeEstimate : 0;
				console.log("current balance", balance);
				console.log("feeEstimate", feeEstimate);
				console.log("theoretic transferAmount", transferAmount);

				console.log(`transferAmount ${transferAmount} of address: ${keypair.publicKey.toBase58()}`);

				const drainBalanceIxn = SystemProgram.transfer({
					fromPubkey: keypair.publicKey,
					toPubkey: wallet.publicKey,
					lamports: balance,
				});
				const drainMessage = new TransactionMessage({
					payerKey: wallet.publicKey,
					recentBlockhash: blockhash,
					instructions: [drainBalanceIxn],
				}).compileToV0Message();

				const drainTx = new VersionedTransaction(drainMessage);
				drainTx.sign([wallet, keypair]);

				// Jito tip
				// const tipSwapIxn = SystemProgram.transfer({
				// 	fromPubkey: wallet.publicKey,
				// 	toPubkey: tipAcct,
				// 	lamports: BigInt(jitoTipAmt),
				// });
				// instructionsForChunk.push(tipSwapIxn);
				
				// Compile the transaction
				if (instructionsForChunk.length > 0) {
					const message = new TransactionMessage({
						payerKey: wallet.publicKey,
						recentBlockhash: blockhash,
						instructions: instructionsForChunk,
					}).compileToV0Message();
	
					const versionedTx = new VersionedTransaction(message);
					versionedTx.sign([wallet, keypair]);
	
					txsSigned.push(versionedTx);
				}

				txsSigned.push(drainTx);
				maxSize++;
			} else {
				console.log(chalk.yellow("No token, WSOL, or significant SOL balance found. Skipping transaction."));
				deleteKeypairFile(keypair, keypairsPath);
			}

			// Send in batches of 5
			if (maxSize === 5 || i === keypairs.length - 1) {
				if (txsSigned.length > 0) {
					if (DEBUG) {
						for (const tx of txsSigned) {
							try {
								const simulationResult = await connection.simulateTransaction(tx, { commitment: "confirmed" });
								if (simulationResult.value.err) {
									const errorMessage = `Simulation tx error: ${JSON.stringify(simulationResult.value.err, null, 2)}`;
									fs.appendFileSync("errorlog.txt", `${new Date().toISOString()} - ${errorMessage}\n`);
									console.log(chalk.red("Error simulating saved to errorlog.txt"));
								} else {
									console.log("Transaction simulation success.");
								}
							} catch (error) {
								console.error("Error during simulation:", error);
							}
						}
					}
					// await sendBundleWithRetry(txsSigned);
					await sendTransactionsSequentially(txsSigned);
					txsSigned = [];
					maxSize = 0;
					console.log(chalk.blue(`Waiting ${delaySellIn} ms`));
					await delay(delaySellIn);
				}
			}
			console.log("");
		}
		keypairsExist = checkKeypairsExist(keypairsPath);
	}

	console.log(chalk.green("All transactions processed and no more keypairs left."));
	await pause();
}

export async function closeSpecificAcc(keypairs: Keypair[], mint: string, jitoTip: number, block: string | Blockhash) {
	const keypairsPath = path.join(keypairsDir, mint);
	if (!fs.existsSync(keypairsPath)) {
		console.log(chalk.red(`No keypairs found for mint: ${mint}`));
		return;
	}

	const BundledTxns: VersionedTransaction[] = [];

	for (let i = 0; i < keypairs.length; i++) {
		const keypair = keypairs[i];

		const instructionsForChunk: TransactionInstruction[] = [];
		const tokenAcc = await spl.getAssociatedTokenAddress(new PublicKey(mint), keypair.publicKey);
		const wsolAcc = await spl.getAssociatedTokenAddress(spl.NATIVE_MINT, keypair.publicKey);

		// Verify accounts exist
		const tokenAccountExists = await checkTokenAccountExists(tokenAcc);
		const wsolAccountExists = await checkTokenAccountExists(wsolAcc);

		if (tokenAccountExists) {
			// Get token balance for selling
			const tokenBalance = await connection.getTokenAccountBalance(tokenAcc);
			const swapAccountKey = {
				inputMint : new PublicKey(mint),
				payer : keypair.publicKey
			}
			// Sell instructions - convert tokens to WSOL
			const sellInstruction = await getSwapInstruction(Number(tokenBalance.value.uiAmountString), 0, swapAccountKey, new PublicKey(mint));

			if (sellInstruction) {
				instructionsForChunk.push(sellInstruction);
				console.log(chalk.green(`Added bonk.fun token sell instructions for ${Number(tokenBalance.value.uiAmountString)} tokens`));
			}
			
			// Burn token account
			let baseTokenBurnInstruction = spl.createCloseAccountInstruction(tokenAcc, wallet.publicKey, keypair.publicKey);
			instructionsForChunk.push(baseTokenBurnInstruction);
		}

		if (wsolAccountExists) {
			// Burn WSOL account
			let wsolBurnInstruction = spl.createCloseAccountInstruction(wsolAcc, wallet.publicKey, keypair.publicKey);
			instructionsForChunk.push(wsolBurnInstruction);
		}

		// Drain leftover SOL
		const balance = await connection.getBalance(keypair.publicKey);
		console.log("balance:", balance);
		
		const feeEstimate = 10000;
		const transferAmount = balance - feeEstimate > 0 ? balance - feeEstimate : 0;

		const drainBalanceIxn = SystemProgram.transfer({
			fromPubkey: keypair.publicKey,
			toPubkey: wallet.publicKey,
			lamports: balance - 5000,
		});
		instructionsForChunk.push(drainBalanceIxn);

		// Create and sign transaction
		const message = new TransactionMessage({ 
			payerKey: keypair.publicKey,
			recentBlockhash: block,
			instructions: instructionsForChunk,
		}).compileToV0Message();

		const versionedTx = new VersionedTransaction(message);
		versionedTx.sign([keypair]);

		BundledTxns.push(versionedTx);

		await sendTransactionsSequentially(BundledTxns);
	}
}

/**
 * Utility to send a batch of VersionedTx with minimal delay/retry logic.
 */
export async function sendBundleWithRetry(txsSigned: VersionedTransaction[]) {
	await delay(100);
	await sendBundle(txsSigned);
}

/**
 * Simple delay helper.
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Checks if an SPL token account exists (non-null).
 */
export async function checkTokenAccountExists(accountPublicKeyString: PublicKey): Promise<boolean> {
	try {
		const accountPublicKey = new PublicKey(accountPublicKeyString);
		const accountInfo = await connection.getAccountInfo(accountPublicKey);

		if (accountInfo === null) {
			if (DEBUG) {
				console.log(chalk.yellow(`Token account ${accountPublicKeyString} does not exist.`));
			}
			return false;
		} else {
			console.log(chalk.green(`Selling from existing token account: ${accountPublicKeyString}`));
			return true;
		}
	} catch (error) {
		console.error(chalk.red(`Error checking account: ${error}`));
		return false;
	}
}

/**
 * Delete a keypair JSON if older than a minute, backing it up in /backup.
 */
export async function deleteKeypairFile(keypair: Keypair, marketOrDir: string) {
	let resolvedDir: string;
	if (marketOrDir.includes("keypairs")) {
		resolvedDir = marketOrDir;
	} else {
		resolvedDir = path.join(keypairsDir, marketOrDir);
	}

	const identifier = keypair.publicKey.toString();
	const filename = `keypair-${identifier}.json`;
	const filePath = path.join(resolvedDir, filename);
	const backupDir = path.join(path.dirname(path.dirname(resolvedDir)), "backup", path.basename(resolvedDir));

	if (!fs.existsSync(filePath)) {
		console.log(`File does not exist: ${filePath}`);
		return;
	}

	const stats = fs.statSync(filePath);
	const creationTime = new Date(stats.birthtime).getTime();
	const currentTime = Date.now();

	if (currentTime - creationTime < 80000) {
		console.log(`Skipping deletion as file is not older than 1 minute: ${filename}`);
		return;
	}

	const transactionCount = await getTransactionCount(keypair.publicKey);
	if (transactionCount === 1) {
		console.log(`Transaction count is 1 (which means it didn't sell) for keypair: ${identifier}. Total TXs: ${transactionCount}`);
		return;
	}

	try {
		if (!fs.existsSync(backupDir)) {
			fs.mkdirSync(backupDir, { recursive: true });
		}
		const backupFilePath = path.join(backupDir, filename);
		fs.copyFileSync(filePath, backupFilePath);

		fs.unlinkSync(filePath);
		if (DEBUG) {
			console.log(`Deleted file for keypair with zero balance: ${filename}`);
		}
		const files = fs.readdirSync(resolvedDir);
		if (files.length === 0) {
			fs.rmdirSync(resolvedDir);
			console.log(`Deleted empty pair folder: ${resolvedDir}`);
		}
	} catch (err) {
		console.error(`Error backing up or deleting file: ${filename}`, err);
	}
}

/**
 * Return total transaction count for a given address.
 */
async function getTransactionCount(publicKey: PublicKey): Promise<number> {
	try {
		const confirmedSignatures = await connection.getSignaturesForAddress(publicKey);
		return confirmedSignatures.length;
	} catch (err) {
		console.error(`Error fetching transaction count for ${publicKey.toString()}`, err);
		return 0;
	}
}

/**
 * Loads all .json keypairs from a directory.
 */
function loadKeypairs(dirPath: string) {
	const keypairs: Keypair[] = [];
	const files = fs.readdirSync(dirPath);

	files.forEach((file) => {
		if (file.endsWith(".json")) {
			const filePath = path.join(dirPath, file);
			const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
			const keypair = Keypair.fromSecretKey(new Uint8Array(fileData));
			keypairs.push(keypair);
		}
	});
	return keypairs;
}

/**
 * True if any .json keypair files exist in the directory.
 */
function checkKeypairsExist(dirPath: string) {
	try {
		if (!fs.existsSync(dirPath)) {
			return false;
		}
		const files = fs.readdirSync(dirPath);
		const keypairFiles = files.filter((file) => file.endsWith(".json"));
		return keypairFiles.length > 0;
	} catch (err) {
		console.error("Error accessing the keypairs directory:", err);
		return false;
	}
}

/**
 *
 * @param mint PublicKey
 * @returns Token program ID
 */
async function getTokenProgramId(mint: PublicKey): Promise<PublicKey> {
	try {
		// First check if it's a Token-2022 account
		try {
			const accountInfo = await connection.getAccountInfo(mint);
			if (accountInfo) {
				// Check the owner of the account
				if (accountInfo.owner.equals(spl.TOKEN_2022_PROGRAM_ID)) {
					console.log(`Mint ${mint.toBase58()} is a Token-2022 token`);
					return spl.TOKEN_2022_PROGRAM_ID;
				}
			}
		} catch (err: any) {
			// If there's an error, default to classic SPL Token
			console.log(`Error checking Token-2022 status: ${err.message}`);
		}

		// Default to classic SPL Token
		console.log(`Mint ${mint.toBase58()} is a classic SPL token`);
		return spl.TOKEN_PROGRAM_ID;
	} catch (error: any) {
		console.error(`Error determining token program ID: ${error.message}`);
		// Default to classic SPL Token
		return spl.TOKEN_PROGRAM_ID;
	}
}

type Direction = "quoteToBase" | "baseToQuote";