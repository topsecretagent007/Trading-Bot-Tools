import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import bs58 from "bs58";
import dotenv from "dotenv";
import chalk from "chalk";

// Load environment variables from .env file
dotenv.config();

function checkEnvVariable(name: string): string {
	const value = process.env[name];
	if (!value) {
		console.error(chalk.red(`Error: Environment variable ${name} is not set.`));
		process.exit(1);
	}
	return value;
}

export const rayFee: PublicKey = new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5");
export const tipAcct: PublicKey = new PublicKey("Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY");
export const RayLiqPoolv4: PublicKey = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");

const rpc: string = checkEnvVariable("RPC"); // Load RPC from .env

export const connection: Connection = new Connection(rpc, {
	commitment: "confirmed",
});

export const wallet: Keypair = Keypair.fromSecretKey(
	bs58.decode(
		checkEnvVariable("SECRET_KEY") // Load secret key from .env
	)
);

export const API_KEY: string = checkEnvVariable("API_KEY"); // Load API key from .env

console.log(chalk.green("Environment variables loaded successfully"));

const providerWallet = new NodeWallet(wallet);

export const provider = new anchor.AnchorProvider(connection, providerWallet, {
	commitment: "confirmed",
});
export const isMainnet = true;
