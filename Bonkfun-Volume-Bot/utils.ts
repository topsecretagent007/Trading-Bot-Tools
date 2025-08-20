import {
	createBurnCheckedInstruction,
	createCloseAccountInstruction,
	harvestWithheldTokensToMint,
	getAssociatedTokenAddressSync,
	NATIVE_MINT,
	TOKEN_PROGRAM_ID,
	TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { connection } from "../config";
import {
	Connection,
	PublicKey,
	Keypair,
	TransactionInstruction,
	clusterApiUrl,
} from "@solana/web3.js";
import BN from "bn.js";
import { 
	Raydium,
	TxVersion,
	getPdaLaunchpadPoolId,
	Curve,
	PlatformConfig,
	LAUNCHPAD_PROGRAM,
 } from "@raydium-io/raydium-sdk-v2";
import Decimal from 'decimal.js'
import { parseGlobalConfigAccount, parsePoolStateAccount, parsePlatformConfigAccount } from "./clients/encrypt";
import { cluster, SELL_EXACT_IN_DISCRIMINATOR, BUY_EXACT_IN_DISCRIMINATOR, RaydiumLaunchPadAccountKeys, FEE_RATE_DENOMINATOR_VALUE, RAYDIUM_LAUNCHLAB_MAINNET_ADDR, LAUNCHPAD_AUTH_SEED, LAUNCHPAD_POOL_EVENT_AUTH_SEED } from "./clients/constants";
import { BigNumber } from "bignumber.js";

let raydium: Raydium | undefined;

export const burnAccount = async (wallet: Keypair, keypair: Keypair, connection: Connection, ata: PublicKey, tokenprogram: PublicKey) => {
	const instructions: Array<TransactionInstruction> = [];

	const ataInfo = // @ts-ignore
		(await connection.getParsedAccountInfo(ata)).value?.data.parsed.info;
	console.log("ata info", ataInfo);

	if (tokenprogram === TOKEN_2022_PROGRAM_ID) {
		const sig = await harvestWithheldTokensToMint(connection, keypair, new PublicKey(ataInfo.mint), [ata], undefined, tokenprogram);
	}
	// const solanaBalance = await connection.getBalance(keypair.publicKey);
	// console.log("token amount---------", ataInfo.tokenAmount.uiAmount);
	// console.log("sol balance---------", solanaBalance);

	if (ataInfo.tokenAmount.uiAmount != 0) {
	  const mint = ataInfo.mint;
	  const burnInx = createBurnCheckedInstruction(
	    ata,
	    new PublicKey(mint),
	    keypair.publicKey,
	    ataInfo.tokenAmount.amount,
	    ataInfo.tokenAmount.decimals,
	    [],
	    tokenprogram
	  );
	  instructions.push(burnInx);
	}

	const closeAtaInx = createCloseAccountInstruction(
		ata, // token account which you want to close
		wallet.publicKey, // destination
		keypair.publicKey, // owner of token account
		[],
		tokenprogram
	);
	instructions.push(closeAtaInx);
	return instructions;
	// for (let i = 0; i < instructions.length; i += 20) {
	//   const instructionsList = instructions.slice(
	//     i,
	//     Math.min(i + 20, instructions.length)
	//   );
	//   if (instructionsList.length == 0) break;
	//   const blockhash = await connection
	//     .getLatestBlockhash()
	//     .then((res) => res.blockhash);
	//   const messageV0 = new TransactionMessage({
	//     payerKey: keypair.publicKey,
	//     recentBlockhash: blockhash,
	//     instructions: [
	//       // ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200000 }),
	//       ...instructionsList,
	//     ],
	//   }).compileToV0Message();

	//   const vtx = new VersionedTransaction(messageV0);
	//   vtx.sign([wallet, keypair]);

	//   const sim = await connection.simulateTransaction(vtx, {
	//     sigVerify: true,
	//   });
	//   console.log(sim);
	//   try {
	//     if (!sim.value.err) {
	//       const sig = await connection.sendTransaction(vtx);
	//       const closeConfirm = await connection.confirmTransaction(sig);
	//       console.log("sig", sig);
	//     } else console.error("simulation error");
	//   } catch (e) {
	//     console.error(e);
	//   }
	// }
};

/**
 * Retrieves the balance of an SPL token associated with a given token account.
 * @param {Connection} connection - The connection object for interacting with the Solana network.
 * @param {PublicKey} tokenAccount - The public key of the token account.
 * @param {PublicKey} payerPubKey - The public key of the payer account.
 * @returns {Promise<number>} The balance of the SPL token.
 * @throws {Error} If no balance is found.
 */
export async function getSPLTokenBalance(connection:Connection, tokenAccount:PublicKey, payerPubKey:PublicKey): Promise<number> {
  const address = getAssociatedTokenAddressSync(tokenAccount, payerPubKey);
  const info = await connection.getTokenAccountBalance(address);
  if (info.value.uiAmount == null) throw new Error("No balance found");
  return info.value.uiAmount;
}

export const buy = async (mint: string, amount: number, keypair: Keypair) => {
  const raydium = await initSdk({ keypair })

  const mintA = new PublicKey(mint)
  const mintB = NATIVE_MINT
  const inAmount = new BN(amount)

  const programId = LAUNCHPAD_PROGRAM // devnet: DEV_LAUNCHPAD_PROGRAM

  const poolId = getPdaLaunchpadPoolId(programId, mintA, mintB).publicKey
  const poolInfo = await raydium.launchpad.getRpcPoolInfo({ poolId })
  const data = await raydium.connection.getAccountInfo(poolInfo.platformId)
  const platformInfo = PlatformConfig.decode(data!.data)

  const shareFeeReceiver = undefined
  const shareFeeRate = shareFeeReceiver ? new BN(0) : new BN(10000) // do not exceed poolInfo.configInfo.maxShareFeeRate
  const slippage = new BN(100) // means 1%
  
  const res = Curve.buyExactIn({
    poolInfo,
    amountB: inAmount,
    protocolFeeRate: poolInfo.configInfo.tradeFeeRate,
    platformFeeRate: platformInfo.feeRate,
    curveType: poolInfo.configInfo.curveType,
    shareFeeRate,
  })

  // Raydium UI usage: https://github.com/raydium-io/raydium-ui-v3-public/blob/master/src/store/useLaunchpadStore.ts#L563
  let { transaction, extInfo, execute } = await raydium.launchpad.buyToken({
    programId,
    mintA,
    // mintB: poolInfo.configInfo.mintB, // optional, default is sol
    // minMintAAmount: res.amountA, // optional, default sdk will calculated by realtime rpc data
    slippage,
    configInfo: poolInfo.configInfo,
    platformFeeRate: platformInfo.feeRate,
    txVersion: TxVersion.V0,
    buyAmount: inAmount,
    // shareFeeReceiver, // optional
    // shareFeeRate,  // optional, do not exceed poolInfo.configInfo.maxShareFeeRate

    // computeBudgetConfig: {
    //   units: 600000,
    //   microLamports: 600000,
    // },
  })
  
  console.log('expected receive amount:', extInfo.outAmount.toString())
  // printSimulate([transaction])
  try {
    const sentInfo = await execute({ sendAndConfirm: true })
    console.log(sentInfo)
    return transaction;
  } catch (e: any) {
    console.log(e)
  }

  process.exit() // if you don't want to end up node execution, comment this line
}

export const sell = async (mint: string, amount: number, keypair: Keypair) => {
  const raydium = await initSdk()

  const mintA = new PublicKey(mint);
  const mintB = NATIVE_MINT

  const programId = LAUNCHPAD_PROGRAM // devnet: DEV_LAUNCHPAD_PROGRAM

  const poolId = getPdaLaunchpadPoolId(programId, mintA, mintB).publicKey
  const poolInfo = await raydium.launchpad.getRpcPoolInfo({ poolId })
  const data = await raydium.connection.getAccountInfo(poolInfo.platformId)
  const platformInfo = PlatformConfig.decode(data!.data)

  const inAmount = new BN(amount)
  const shareFeeReceiver = undefined
  const shareFeeRate = shareFeeReceiver ? new BN(0) : new BN(10000) // do not exceed poolInfo.configInfo.maxShareFeeRate
  const slippage = new BN(100) // means 1%

  const res = Curve.sellExactIn({
    poolInfo,
    amountA: inAmount,
    protocolFeeRate: poolInfo.configInfo.tradeFeeRate,
    platformFeeRate: platformInfo.feeRate,
    curveType: poolInfo.configInfo.curveType,
    shareFeeRate,
  })
  console.log(
    'expected out amount: ',
    res.amountB.toString(),
    'minimum out amount: ',
    new Decimal(res.amountB.toString()).mul((10000 - slippage.toNumber()) / 10000).toFixed(0)
  )

  // Raydium UI usage: https://github.com/raydium-io/raydium-ui-v3-public/blob/master/src/store/useLaunchpadStore.ts#L637
  const { execute, transaction, builder } = await raydium.launchpad.sellToken({
    programId,
    mintA,
    // mintB, // default is sol
    configInfo: poolInfo.configInfo,
    platformFeeRate: platformInfo.feeRate,
    txVersion: TxVersion.V0,
    sellAmount: inAmount,
  })

  // printSimulate([transaction])
  try {
    return transaction
  } catch (e: any) {
    console.log(e)
  }

  process.exit() // if you don't want to end up node execution, comment this line
}

export const initSdk = async (params?: { loadToken?: boolean, keypair: Keypair }) => {
  if (raydium) return raydium
  if (connection.rpcEndpoint === clusterApiUrl('mainnet-beta'))
  console.warn('using free rpc node might cause unexpected error, strongly suggest uses paid rpc node')

  console.log(`connect to rpc ${connection.rpcEndpoint} in ${cluster}`)
  raydium = await Raydium.load({
    owner: params?.keypair,
    connection,
    cluster,
    disableFeatureCheck: true,
    disableLoadToken: !params?.loadToken,
    blockhashCommitment: 'finalized',
  })
  return raydium
}

export async function getPoolInfo(mint: string) {
  
  const mintA = new PublicKey(mint)
  const mintB = NATIVE_MINT

  const programId = LAUNCHPAD_PROGRAM // devnet: DEV_LAUNCHPAD_PROGRAM

  const poolId = getPdaLaunchpadPoolId(programId, mintA, mintB).publicKey;
    const poolRawData = await connection.getAccountInfo(poolId);
  if (!poolRawData) {
    return null
  }
  const poolData = parsePoolStateAccount(poolRawData.data);

  return {poolData, poolId}
}

export async function getSwapQuote(baseAmountIn: number, inputMint: string, tokenMint: string, slippage: number = 0): Promise<number> {
    const poolInfo = await getPoolInfo(tokenMint);
    if (!poolInfo?.poolData) {
      throw new Error("Invalid pool!")
    }
    const { virtualBase, virtualQuote, realBase, realQuote, baseDecimals, quoteDecimals, platformConfig, globalConfig } = poolInfo?.poolData;
    const [globalConfigData, platformConfigData] = await connection.getMultipleAccountsInfo([platformConfig, globalConfig])
    if (!globalConfigData || !platformConfigData) throw new Error("Error in getting config info")
      
    const parsedGlobal = parseGlobalConfigAccount(globalConfigData.data)
    const platformConfigParsed = parsePlatformConfigAccount(platformConfigData.data)
    const feeRate = parsedGlobal.tradeFeeRate.plus(platformConfigParsed.feeRate)

    const fee = calculateFee({ amount: BigNumber(baseAmountIn), feeRate });

    let amountOut: number;
    if (inputMint == NATIVE_MINT.toBase58()) {
        amountOut = getAmountOut({
            amountIn: BigNumber(baseAmountIn).minus(fee),
            inputReserve: virtualQuote.plus(realQuote),
            outputReserve: virtualBase.minus(realBase),
        }).toNumber();
        console.log("native out:", amountOut);
        
    } else {
        amountOut = getAmountOut({
            amountIn: BigNumber(baseAmountIn).minus(fee),
            inputReserve: virtualBase.minus(realBase),
            outputReserve: virtualQuote.plus(realQuote),
        }).toNumber()
        console.log("token out:", amountOut);

    }

    return Math.floor(amountOut * (1 - slippage / 100))
}

export async function getSwapInstruction(
    amountIn: number,
    minAmountOut: number,
    swapAccountkey: RaydiumLaunchPadAccountKeys,
    mint: PublicKey
): Promise<TransactionInstruction | null> {
  
  // const amount = await getSwapQuote(amountIn, swapAccountkey.inputMint.toBase58(), mint.toBase58());
  const poolInfo = await getPoolInfo(mint.toBase58());
  const { inputMint, payer } = swapAccountkey;
  const [authority] = PublicKey.findProgramAddressSync([LAUNCHPAD_AUTH_SEED], RAYDIUM_LAUNCHLAB_MAINNET_ADDR);
  const [eventAuth] = PublicKey.findProgramAddressSync([LAUNCHPAD_POOL_EVENT_AUTH_SEED], RAYDIUM_LAUNCHLAB_MAINNET_ADDR);
  if (!poolInfo?.poolData) {
    return null
  }
  
  const baseUserAta = getAssociatedTokenAddressSync(poolInfo?.poolData.baseMint, payer);
  const quoteUserAta = getAssociatedTokenAddressSync(poolInfo?.poolData.quoteMint, payer);

  if (inputMint.toBase58() == NATIVE_MINT.toBase58()) {
      return buyExactInIx(
          RAYDIUM_LAUNCHLAB_MAINNET_ADDR,
          payer,
          authority,
          poolInfo?.poolData.globalConfig,
          poolInfo?.poolData.platformConfig,
          poolInfo.poolId,
          baseUserAta,
          quoteUserAta,
          poolInfo?.poolData.baseVault,
          poolInfo?.poolData.quoteVault,
          poolInfo?.poolData.baseMint,
          poolInfo?.poolData.quoteMint,
          TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          eventAuth,
          amountIn,
          minAmountOut,
          0
      )
  } else {
      return sellExactInIx(
          RAYDIUM_LAUNCHLAB_MAINNET_ADDR,
          payer,
          authority,
          poolInfo?.poolData.globalConfig,
          poolInfo?.poolData.platformConfig,
          poolInfo.poolId,
          baseUserAta,
          quoteUserAta,
          poolInfo?.poolData.baseVault,
          poolInfo?.poolData.quoteVault,
          poolInfo?.poolData.baseMint,
          poolInfo?.poolData.quoteMint,
          TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          eventAuth,
          amountIn * 10 ** poolInfo?.poolData.baseDecimals,
          minAmountOut,
          0
      )
  }

}

export function buyExactInIx(
    programId: PublicKey,
    payer: PublicKey,
    authority: PublicKey,
    globalConfig: PublicKey,
    platformConfig: PublicKey,
    poolState: PublicKey,
    userBaseToken: PublicKey,
    userQuoteToken: PublicKey,
    baseVault: PublicKey,
    quoteVault: PublicKey,
    baseTokenMint: PublicKey,
    quoteTokenMint: PublicKey,
    baseTokenProgram: PublicKey,
    quoteTokenProgram: PublicKey,
    eventAuthority: PublicKey,
    amountIn: number,
    minimumAmountOut: number,
    shareFeeRate: number
): TransactionInstruction {

    const discriminator = Buffer.from(BUY_EXACT_IN_DISCRIMINATOR); // Raydium v4 swap_base_in discriminator
    const amountInBuf = Buffer.alloc(8);
    const minimumAmountOutBuf = Buffer.alloc(8);
    const shareFeeRateBuf = Buffer.alloc(8);
    amountInBuf.writeBigUInt64LE(BigInt(amountIn));
    minimumAmountOutBuf.writeBigUInt64LE(BigInt(minimumAmountOut));
    shareFeeRateBuf.writeBigUInt64LE(BigInt(shareFeeRate));
    
    const data = Buffer.concat([discriminator, amountInBuf, minimumAmountOutBuf, shareFeeRateBuf]);
    
    
    const keys = [

    ];
    
    return new TransactionInstruction({
        keys,
        programId,
        data,
    });
}

export function sellExactInIx(
    programId: PublicKey,
    payer: PublicKey,
    authority: PublicKey,
    globalConfig: PublicKey,
    platformConfig: PublicKey,
    poolState: PublicKey,
    userBaseToken: PublicKey,
    userQuoteToken: PublicKey,
    baseVault: PublicKey,
    quoteVault: PublicKey,
    baseTokenMint: PublicKey,
    quoteTokenMint: PublicKey,
    baseTokenProgram: PublicKey,
    quoteTokenProgram: PublicKey,
    eventAuthority: PublicKey,
    amountIn: number,
    minimumAmountOut: number,
    shareFeeRate: number
): TransactionInstruction {
    const discriminator = Buffer.from(SELL_EXACT_IN_DISCRIMINATOR); // Raydium v4 swap_base_in discriminator
    const amountInBuf = Buffer.alloc(8);
    const minimumAmountOutBuf = Buffer.alloc(8);
    const shareFeeRateBuf = Buffer.alloc(8);
    amountInBuf.writeBigUInt64LE(BigInt(amountIn));
    minimumAmountOutBuf.writeBigUInt64LE(BigInt(minimumAmountOut));
    shareFeeRateBuf.writeBigUInt64LE(BigInt(shareFeeRate));
    
    const data = Buffer.concat([discriminator, amountInBuf, minimumAmountOutBuf, shareFeeRateBuf]);

    const keys = [
        
    ];

    return new TransactionInstruction({
        keys,
        programId,
        data,
    });
}

export function calculateFee({ amount, feeRate }: { amount: BigNumber; feeRate: BigNumber }): BigNumber {
    return ceilDiv(amount, feeRate, FEE_RATE_DENOMINATOR_VALUE);
}

export function ceilDiv(
    tokenAmount: BigNumber,
    feeNumerator: BigNumber,
    feeDenominator: BigNumber
): BigNumber {
    return tokenAmount
        .multipliedBy(feeNumerator)
        .plus(feeDenominator)
        .minus(1)
        .dividedToIntegerBy(feeDenominator);
}

export function getAmountOut({
    amountIn,
    inputReserve,
    outputReserve,
}: {
    amountIn: BigNumber;
    inputReserve: BigNumber;
    outputReserve: BigNumber;
}): BigNumber {
    const numerator = amountIn.times(outputReserve);
    const denominator = inputReserve.plus(amountIn);
    const amountOut = numerator.div(denominator);
    return amountOut;
}