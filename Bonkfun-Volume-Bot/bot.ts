import {
	TransactionMessage,
	VersionedTransaction,
	PublicKey,
	TransactionInstruction,
	Keypair,
	SystemProgram,
	ComputeBudgetProgram,
	LAMPORTS_PER_SOL,
	Blockhash,
} from "@solana/web3.js";
import { lookupTableProvider } from "./clients/LookupTableProvider";
import { connection, wallet, tipAcct, isMainnet, provider } from "../config";
import * as spl from "@solana/spl-token";
import path from "path";
import fs from "fs";
import promptSync from "prompt-sync";
import { searcherClient } from "./clients/jito";
import { Bundle as JitoBundle } from "jito-ts/dist/sdk/block-engine/types.js";
import chalk from "chalk";
import { retryOperation, pause } from "./clients/utils";
import { checkTokenAccountExists, closeSpecificAcc, deleteKeypairFile } from "./retrieve";
import dotenv from "dotenv";
import { getSwapInstruction, sell, buy } from "./utils";

dotenv.config();

require("dotenv").config();

const DEBUG = process.env.DEBUG?.toLowerCase() === "true";
const prompt = promptSync();
const keypairsDir = "./src/keypairs";

/**
 * Ensure the keypairs directory exists
 */
if (!fs.existsSync(keypairsDir)) {
	fs.mkdirSync(keypairsDir, { recursive: true });
}

/**
 * Enhanced executeSwaps function that supports LaunchLab
 */
async function executeSwaps(
	keypairs: Keypair[],
	jitoTip: number,
	block: string | Blockhash,
	buyAmount: number,
	baseMint: PublicKey
) {
	const BundledTxns: VersionedTransaction[] = [];
	const solIxs: TransactionInstruction[] = [];

	// const rent = await connection.getMinimumBalanceForRentExemption(8);
	const initialTransferAmount = 1400000;

	/**
	 * 1) Send a small amount of SOL to each new keypair so they can pay fees.
	 */
	for (let index = 0; index < keypairs.length; index++) {
		const keypair = keypairs[index];
		console.log("Processing keypair for fee transfer:", keypair.publicKey.toString());

		const TransferLamportsTxnfee = SystemProgram.transfer({
			fromPubkey: wallet.publicKey,
			toPubkey: keypair.publicKey,
			lamports: initialTransferAmount, // Enough for txn fee
		});

		solIxs.push(TransferLamportsTxnfee);
	}

	// Build a transaction to handle all "transfer SOL for fee" instructions
	const addressesMain1: PublicKey[] = [];
	solIxs.forEach((ixn) => {
		ixn.keys.forEach((key) => {
			addressesMain1.push(key.pubkey);
		});
	});
	const lookupTablesMain1 = lookupTableProvider.computeIdealLookupTablesForAddresses(addressesMain1);

	const message = new TransactionMessage({
		payerKey: wallet.publicKey,
		recentBlockhash: block,
		instructions: solIxs,
	}).compileToV0Message(lookupTablesMain1);

	const sendsol = new VersionedTransaction(message);
	sendsol.sign([wallet]);

	try {
		const serializedMsg = sendsol.serialize();
		if (serializedMsg.length > 1232) {
			console.log("tx too big");
			process.exit(0);
		}

		if (DEBUG) {
			const simulationResult = await connection.simulateTransaction(sendsol, {
				commitment: "confirmed",
			});
			if (simulationResult.value.err) {
				const errorMessage = `Simulation sendsol error: ${JSON.stringify(simulationResult.value.err, null, 2)}`;
				fs.appendFileSync("errorlog.txt", `${new Date().toISOString()} - ${errorMessage}\n`);
				console.log(chalk.red("Error simulating saved to errorlog.txt"));
			} else {
				console.log("Transaction airdrop sol simulation success.");
			}
		}

		BundledTxns.push(sendsol);
	} catch (e) {
		console.log(e, "error with volumeTX");
		process.exit(0);
	}

	/**
	 * 2) For each keypair, create token accounts, wrap SOL, and swap.
	 */
	for (let index = 0; index < keypairs.length; index++) {
		const keypair = keypairs[index];
		let tokenMint: PublicKey = new PublicKey(baseMint);

		console.log("Processing swap for keypair:", keypair.publicKey.toString());

		//console.log("tokenMint determined:", tokenMint.toString());

		// Get the token program ID for the non-WSOL token
		const tokenProgramId = await getTokenProgramId(tokenMint);

		// WSOL is always a classic SPL token
		const wSolATA = await spl.getAssociatedTokenAddress(spl.NATIVE_MINT, keypair.publicKey, false, spl.TOKEN_PROGRAM_ID, spl.ASSOCIATED_TOKEN_PROGRAM_ID);

		// Get the token ATA with the correct program ID
		const TokenATA = await spl.getAssociatedTokenAddress(tokenMint, keypair.publicKey, false, tokenProgramId, spl.ASSOCIATED_TOKEN_PROGRAM_ID);

		// Create ATA instructions with correct program IDs
		const createTokenBaseAta = spl.createAssociatedTokenAccountIdempotentInstruction(
			wallet.publicKey,
			TokenATA,
			keypair.publicKey,
			tokenMint,
			tokenProgramId,
			spl.ASSOCIATED_TOKEN_PROGRAM_ID
		);

		const createWSOLAta = spl.createAssociatedTokenAccountIdempotentInstruction(
			wallet.publicKey,
			wSolATA,
			keypair.publicKey,
			spl.NATIVE_MINT,
			spl.TOKEN_PROGRAM_ID,
			spl.ASSOCIATED_TOKEN_PROGRAM_ID
		);

		// Calculate fee transfer amount (1% of buy amount)

		// Add a 15% buffer to the buy amount to ensure sufficient funds
		const buyWsolAmount = buyAmount * LAMPORTS_PER_SOL * 1.15;

		// Total amount to transfer: buy amount + buffer + fee amount

		// Transfer enough SOL to wrap as WSOL - include the fee amount in the total
		const TransferLamportsWSOL = SystemProgram.transfer({
			fromPubkey: wallet.publicKey,
			toPubkey: wSolATA,
			lamports: Math.trunc(buyWsolAmount),
		});

		// SyncNative with correct program ID to ensure WSOL is synced properly
		const syncNativeIx = spl.createSyncNativeInstruction(wSolATA, spl.TOKEN_PROGRAM_ID);

		/////////// buy ///////////////
		const swapAccountKey = {
			inputMint : spl.NATIVE_MINT,
			payer : keypair.publicKey
		}
		const buyInstruction = 
		const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
			units: 20000000,
		});
		const modifyComputeFee = ComputeBudgetProgram.setComputeUnitPrice({
			microLamports: 9000,
		});
		// Create token accounts and instructions
		let volumeIxs: TransactionInstruction[] = []
		if (buyInstruction) {
			volumeIxs = [modifyComputeUnits, modifyComputeFee, createWSOLAta, TransferLamportsWSOL, syncNativeIx, createTokenBaseAta, buyInstruction];
		}

		if (index === keypairs.length - 1) {
			// Last transaction includes tip
			const tipIxn = SystemProgram.transfer({
				fromPubkey: wallet.publicKey,
				toPubkey: tipAcct,
				lamports: BigInt(jitoTip),
			});
			volumeIxs.push(tipIxn);
		}

		const addressesMain: PublicKey[] = [];
		volumeIxs.forEach((ixn) => {
			ixn.keys.forEach((key) => {
				addressesMain.push(key.pubkey);
			});
		});
		const lookupTablesMain = lookupTableProvider.computeIdealLookupTablesForAddresses(addressesMain);

		const messageV0 = new TransactionMessage({
			payerKey: keypair.publicKey,
			recentBlockhash: block,
			instructions: volumeIxs,
		}).compileToV0Message(lookupTablesMain);

		const extndTxn = new VersionedTransaction(messageV0);
		extndTxn.sign([wallet, keypair]);

		try {
			const serializedMsg = extndTxn.serialize();
			if (serializedMsg.length > 1232) {
				console.log("tx too big");
				process.exit(0);
			}
			BundledTxns.push(extndTxn);
			// BundledTxns.push(buyTx);	
			console.log("Transaction added to bundle");
		} catch (e) {
			console.log(e, "error with volumeTX");
			process.exit(0);
		}
	}

	console.log("Sending bundle with", BundledTxns.length, "transactions");
	// Finally, send all transactions as a bundle
	// await sendBundle(BundledTxns);
	// await sendTransactionsSequentially(BundledTxns);
}

/**
 * Updated extender function to use the integrated executeSwaps for launchlab
 */
export async function extender(config: any = null) {
	console.clear();
	console.log(chalk.green("\n==================== Buy Step ===================="));
	console.log(chalk.yellow("Follow the instructions below to perform the buy step.\n"));

	let minAndMaxBuy, minAndMaxSell, cyclesIn, delayIn, jitoTipAmtInput, minAndMaxwalletNumber;
	let baseMint: PublicKey | undefined = undefined;

	if (config) {
		baseMint = config.basemint;
		minAndMaxBuy = config.minAndMaxBuy;
		minAndMaxSell = config.minAndMaxSell;
		cyclesIn = config.cycles;
		delayIn = config.delay;
		minAndMaxwalletNumber = config.minAndMaxwalletNumber;
		jitoTipAmtInput = config.jitoTipAmt.toString();
	} else {
		const basemintString = prompt(chalk.cyan("Input token mint: "));
		baseMint = new PublicKey(basemintString);
		jitoTipAmtInput = prompt(chalk.cyan("Jito tip in Sol (Ex. 0.01): "));
		minAndMaxBuy = prompt(chalk.cyan("Enter the amount of min and max amount you want to BUY (syntax: MIN_AMOUNT MAX_AMOUNT): "));
		minAndMaxSell = prompt(chalk.cyan("Enter the amount of min and max amount you want to Sell(syntax: MIN_AMOUNT MAX_AMOUNT): "));
		minAndMaxwalletNumber = prompt(chalk.cyan("Enter the amount wallets you want to sell per cycle(syntax: MIN_AMOUNT MAX_AMOUNT): "));
		delayIn = prompt(chalk.cyan("Min and Max Delay between swaps in seconds Example MIN_DELAY MAX_DELAY: "));
		cyclesIn = prompt(chalk.cyan("Number of bundles to perform (Ex. 50): "));
	}
	const jitoTipAmt = parseFloat(jitoTipAmtInput) * LAMPORTS_PER_SOL;

	if (jitoTipAmtInput) {
		const tipValue = parseFloat(jitoTipAmtInput);
		if (tipValue >= 0.1) {
			console.log(chalk.red("Error: Tip value is too high. Please enter a value less than or equal to 0.1."));
			process.exit(0x0);
		}
	} else {
		console.log(chalk.red("Error: Invalid input. Please enter a valid number."));
		process.exit(0x0);
	}

	const cycles = parseFloat(cyclesIn);

	// Prepare directories for keypair storage
	if (!baseMint) {
		console.log("No mint supply!");
		
		return 
	}
	const marketKeypairsDir = path.join(keypairsDir, baseMint.toBase58());
	if (!fs.existsSync(marketKeypairsDir)) {
		fs.mkdirSync(marketKeypairsDir, { recursive: true });
	}

	if (!baseMint) {
		console.log("No mint address!");
		return
	}
	const backupDir = path.join(path.dirname(keypairsDir), "backup", baseMint.toBase58());

	if (!fs.existsSync(backupDir)) {
		fs.mkdirSync(backupDir, { recursive: true });
	}

	// Get the wallet's initial balance
	let walletBalance = 0;
	try {
		walletBalance = (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL;
	} catch (error) {
		console.error(chalk.red("Error fetching wallet balance:"), error);
	}
	const initialBalance = walletBalance;
	console.log(chalk.green(`Initial Wallet Balance: ${initialBalance.toFixed(3)} SOL`));

	for (let i = 0; i < cycles; i++) {
		console.log("");
		console.log(`-------------------------------------- ${i + 1} ---------------------------------------------`);

		const buyAmounts = minAndMaxBuy.split(" ").map(Number);
		const delayAmounts = 
		const sellAmounts = 
		const walletNumbers =

		const buyAmount = getRandomNumber(buyAmounts[0], buyAmounts[1]);
		const delay = getRandomNumber(delayAmounts[0], delayAmounts[1]);
		const sellAmount = getRandomNumber(sellAmounts[0], sellAmounts[1]);
		const walletNumber = getRandomNumber(walletNumbers[0], walletNumbers[1]);
		// const walletNumber = 0;

		// Generate new keypair(s) for the BUY step
		const keypairs: Keypair[] = [];
		for (let j = 0; j < walletNumber; j++) {
			const keypair = Keypair.generate();
			if (isValidSolanaAddress(keypair.publicKey)) {
				keypairs.push(keypair);

				const filename = `keypair-${keypair.publicKey.toString()}.json`;
				const filePath = path.join(marketKeypairsDir, filename);
				fs.writeFileSync(filePath, JSON.stringify(Array.from(keypair.secretKey)));
			} else {
				console.error(chalk.red("Invalid keypair generated, skipping..."));
			}
		}

		// Get the latest blockhash with retry logic
		let blockhash = "";
		try {
			blockhash = (await retryOperation(() => connection.getLatestBlockhash())).blockhash;
		} catch (error) {
			console.error(chalk.red("Error fetching latest blockhash:"), error);
			continue; // Skip this iteration and move to the next cycle
		}
		//console.log("----------- swap --------------------");

		try {
			// Use the integrated executeSwaps for both pool types
			if (baseMint) {
				console.log("------------ buy ------------");
				
				await executeSwaps(keypairs, jitoTipAmt, blockhash, buyAmount, baseMint);
			}
		} catch (error) {
			console.error(chalk.red("Error executing swaps:"), error);
		}

		/**
		 * After the BUY step, we pick older keypairs (>=30s old) to SELL/close the accounts.
		 */
		let sellKeypairs = new Set<Keypair>();
		const files = fs.readdirSync(marketKeypairsDir);
		console.log("------------ sell ------------");

		for (const file of files) {
			const filePath = path.join(marketKeypairsDir, file);
			const stats = fs.statSync(filePath);
			const creationTime = new Date(stats.birthtime).getTime();
			const currentTime = Date.now();

			if (currentTime - creationTime >= 100) { //30000
				const keypairData = JSON.parse(fs.readFileSync(filePath, "utf8"));
				const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
				const WSOLataKeypair = await spl.getAssociatedTokenAddress(spl.NATIVE_MINT, keypair.publicKey);

				let tokenAccountExists = false;
				try {
					tokenAccountExists = await checkTokenAccountExists(WSOLataKeypair);
				} catch (error) {
					console.error(chalk.red("Error checking token account existence:"), error);
				}

				if (tokenAccountExists) {
					sellKeypairs.add(keypair);
				} else {
					console.log(chalk.yellow(`Skipping empty keypair: ${keypair.publicKey.toString()}`));
					deleteKeypairFile(keypair, marketKeypairsDir);
				}
			}

			if (sellKeypairs.size >= sellAmount) break; // Limit to specified sellAmount per cycle
		}

		const sellKeypairList = Array.from(sellKeypairs) as Keypair[];
		while (sellKeypairList.length > 0) {
			const chunk = sellKeypairList.splice(0, 5);
			try {
				await closeSpecificAcc(chunk, baseMint.toBase58(), jitoTipAmt, blockhash);

				await new Promise((resolve) => setTimeout(resolve, 6000)); // Small delay between chunks
			} catch (error) {
				console.error(chalk.red("Error closing accounts:"), error);
			}
		}

		// Delay between cycles
		await new Promise((resolve) => setTimeout(resolve, delay * 1000));
		console.log(chalk.green(`Sent buy #${i + 1} transaction of ${buyAmount.toFixed(5)} SOL. Waiting ${delay} seconds before next buy...`));

		// Update wallet balance
		try {
			walletBalance = (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL;
			console.log(chalk.green(`Wallet Balance after buy #${i + 1}: ${walletBalance.toFixed(3)} SOL`));
		} catch (error) {
			console.error(chalk.red("Error fetching wallet balance:"), error);
		}
	}

	console.log(chalk.green("\nExecution completed."));
	console.log(chalk.green("Returning to main menu..."));
	await pause();
}

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

export async function sendTransactionsSequentially(transactions: VersionedTransaction[]): Promise<any[]> {
	console.log(`Sending ${transactions.length} transactions sequentially...`);

	const results: any[] = [];

	for (let i = 0; i < transactions.length; i++) {
		try {
			console.log(`Sending transaction ${i + 1}/${transactions.length}`);

			const signature = await connection.sendTransaction(transactions[i], {
				skipPreflight: false,
				preflightCommitment: "confirmed",
				maxRetries: 3,
			});

			console.log(`Transaction ${i + 1} sent with signature: ${signature}`);

			// Wait for confirmation
			const confirmation = await connection.confirmTransaction(
				{
					signature,
					blockhash: transactions[i].message.recentBlockhash,
					lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
				},
				"confirmed"
			);

			if (confirmation.value.err) {
				console.error(`Transaction ${i + 1} failed: ${JSON.stringify(confirmation.value.err)}`);
			} else {
				console.log(`Transaction ${i + 1} confirmed successfully`);
			}

			results.push({
				signature,
				status: confirmation.value.err ? "failed" : "success",
				error: confirmation.value.err,
			});
		} catch (error: any) {
			// Check if error has getLogs method
			if (error && typeof error === "object" && "getLogs" in error && typeof error.getLogs === "function") {
				try {
					console.error(`Transaction ${i + 1} failed, getting detailed logs...`);

					// Handle the case where getLogs returns a Promise
					let logsData;
					try {
						// Try to await the getLogs if it's a Promise
						const logResult = error.getLogs();
						if (logResult instanceof Promise) {
							logsData = await logResult;
						} else {
							logsData = logResult;
						}
					} catch (logError) {
						// If awaiting fails, use the original error
						logsData = error.message || "Unknown error";
					}

					// Format logs data for display and file storage
					let formattedLogs;
					if (Array.isArray(logsData)) {
						formattedLogs = logsData.join("\n");
					} else if (typeof logsData === "object") {
						formattedLogs = JSON.stringify(logsData, null, 2);
					} else {
						formattedLogs = String(logsData);
					}

					console.error(`Transaction ${i + 1} detailed logs:`);
					console.error(formattedLogs);

					// Save to error.txt
					const errorContent =
						`\n[${new Date().toISOString()}] Transaction ${i + 1} error:\n` + `${formattedLogs}\n` + `${error.stack || error.message || ""}\n${"=".repeat(50)}\n`;

					fs.appendFileSync("error.txt", errorContent);
					console.log(`Error details saved to error.txt`);
				} catch (fsError: any) {
					console.error(`Failed to handle or write error logs: ${fsError.message}`);
				}
			} else {
				// Handle regular errors
				console.error(`Error sending transaction ${i + 1}:`, error);

				// Save regular errors to error.txt
				try {
					const errorContent =
						`\n[${new Date().toISOString()}] Transaction ${i + 1} error:\n` + `${error.message || "Unknown error"}\n` + `${error.stack || ""}\n${"=".repeat(50)}\n`;

					fs.appendFileSync("error.txt", errorContent);
					console.log(`Error details saved to error.txt`);
				} catch (fsError: any) {
					console.error(`Failed to write error to file: ${fsError.message}`);
				}
			}

			results.push({
				status: "failed",
				error: error.message || "Unknown error",
			});
		}
	}

	return results;
}

/**
 * Loads all the keypairs from the specified directory for a given marketID.
 */
function loadKeypairs(marketID: string) {
	const keypairs: Keypair[] = [];
	const marketKeypairsPath = path.join(keypairsDir, marketID);

	if (!fs.existsSync(marketKeypairsPath)) {
		return keypairs; // Return empty if directory doesn't exist
	}

	const files = fs.readdirSync(marketKeypairsPath);

	files.forEach((file) => {
		if (file.endsWith(".json")) {
			const filePath = path.join(marketKeypairsPath, file);
			const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
			const keypair = Keypair.fromSecretKey(new Uint8Array(fileData));
			keypairs.push(keypair);
		}
	});
	return keypairs;
}

/**
 * Sends a bundle of VersionedTransactions using the Jito searcherClient.
 */
export async function sendBundle(bundledTxns: VersionedTransaction[]) {
	try {
		const bundleResult = await searcherClient.sendBundle(new JitoBundle(bundledTxns, bundledTxns.length));

		if (bundleResult && typeof bundleResult === "object") {
			if (bundleResult.ok && bundleResult.value) {
				console.log(`Bundle ${bundleResult.value} sent.`);
			} else {
				console.log(`Bundle sent. Result:`, JSON.stringify(bundleResult));
			}
		} else {
			console.log(`Bundle ${bundleResult} sent.`);
		}

		//*
		// Assuming onBundleResult returns a Promise<BundleResult>
		/*
		const result = await new Promise((resolve, reject) => {
			searcherClient.onBundleResult(
				(result) => {
					console.log("Received bundle result:", result);
					resolve(result); // Resolve the promise with the result
				},
				(e: Error) => {
					console.error("Error receiving bundle result:", e);
					reject(e); // Reject the promise if there's an error
				}
			);
		});

		console.log("Result:", result);
*/
		//
	} catch (error) {
		const err = error as any;
		console.error("Error sending bundle:", err.message);

		if (err?.message?.includes("Bundle Dropped, no connected leader up soon")) {
			console.error("Error sending bundle: Bundle Dropped, no connected leader up soon.");
		} else {
			console.error("An unexpected error occurred:", err.message);
		}
	}
}

/**
 * Utility to produce a random number within [min, max], with 1 decimal place.
 */
function getRandomNumber(min: number, max: number) {
	const range = max - min;
	const decimal = Math.floor(Math.random() * (range * 10 + 1)) / 10;
	return min + decimal;
}

/**
 * Checks if a given PublicKey is a valid Solana address.
 */
function isValidSolanaAddress(address: PublicKey) {
	try {
		new PublicKey(address); // Will throw if invalid
		return true;
	} catch (e) {
		return false;
	}
}


