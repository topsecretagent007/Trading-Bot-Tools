import { PublicKey, Signer, Transaction } from "@solana/web3.js";
import { BigNumber } from "bignumber.js";

export const cluster = 'mainnet'; // 'mainnet' | 'devnet'

export const SELL_EXACT_IN_DISCRIMINATOR = Buffer.from([
    149, 39, 222, 155, 211, 124, 152, 26,
]);

export const BUY_EXACT_IN_DISCRIMINATOR = Buffer.from([
    250, 234, 13, 123, 213, 156, 19, 236,
]);

export interface RaydiumLaunchPadAccountKeys {
    inputMint : PublicKey,
    payer : PublicKey
}
export const FEE_RATE_DENOMINATOR_VALUE = BigNumber(1_000_000);
export const RAYDIUM_LAUNCHLAB_MAINNET_ADDR = new PublicKey("LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj")
export const LAUNCHPAD_AUTH_SEED = Buffer.from("vault_auth_seed", "utf8");
export const LAUNCHPAD_POOL_EVENT_AUTH_SEED = Buffer.from("__event_authority", "utf8");

export interface GlobalConfigAccount {
    epoch: BigNumber;
    curveType: number;
    index: number;
    migrateFee: BigNumber;
    tradeFeeRate: BigNumber;
    maxShareFeeRate: BigNumber;
    minBaseSupply: BigNumber;
    maxLockRate: BigNumber;
    minBaseSellRate: BigNumber;
    minBaseMigrateRate: BigNumber;
    minQuoteFundRaising: BigNumber;
    quoteMint: PublicKey;
    protocolFeeOwner: PublicKey;
    migrateFeeOwner: PublicKey;
    migrateToAmmWallet: PublicKey;
    migrateToCpswapWallet: PublicKey;
    padding: BigNumber[];
}

export interface PlatformConfigAccount {
    epoch: BigNumber;
    platformFeeWallet: PublicKey;
    platformNftWallet: PublicKey;
    platformScale: BigNumber;
    creatorScale: BigNumber;
    burnScale: BigNumber;
    feeRate: BigNumber;
    name: string;
    web: string;
    img: string;
}

export interface PoolStateAccount {
	epoch: BigNumber;
	authBump: number;
	status: number;
	baseDecimals: number;
	quoteDecimals: number;
	migrateType: number;
	supply: BigNumber;
	totalBaseSell: BigNumber;
	virtualBase: BigNumber;
	virtualQuote: BigNumber;
	realBase: BigNumber;
	realQuote: BigNumber;
	totalQuoteFundRaising: BigNumber;
	quoteProtocolFee: BigNumber;
	platformFee: BigNumber;
	migrateFee: BigNumber;
	vestingSchedule: VestingSchedule;
	globalConfig: PublicKey;
	platformConfig: PublicKey;
	baseMint: PublicKey;
	quoteMint: PublicKey;
	baseVault: PublicKey;
	quoteVault: PublicKey;
	creator: PublicKey;
}

export interface VestingSchedule {
	totalLockedAmount: BigNumber;
	cliffPeriod: BigNumber;
	unlockPeriod: BigNumber;
	startTime: BigNumber;
	allocatedShareAmount: BigNumber;
}