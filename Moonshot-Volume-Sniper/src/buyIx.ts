import { Environment, FixedSide, Moonshot } from '@wen-moon-ser/moonshot-sdk';
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import testWallet from '../test-wallet.json';

export const buyIx = async (): Promise<void> => {
  console.log('--- Buying token example ---');

  const rpcUrl = 'https://api.devnet.solana.com';

  const connection = new Connection(rpcUrl);

  const moonshot = new Moonshot({
    rpcUrl,
    environment: Environment.DEVNET,
    chainOptions: {
      solana: { confirmOptions: { commitment: 'confirmed' } },
    },
  });

  const token = await moonshot
    .Token({
      mintAddress: '9ThH8ayxFCFZqssoZmodgvtbTiBmMoLWUqQhRAP89Y97',
    })
    .preload();

  const curvePos = await token.getCurvePosition();
  console.log('Current position of the curve: ', curvePos); // Prints the current curve position

  // make sure creator has funds
  const creator = Keypair.fromSecretKey(Uint8Array.from(testWallet));
  console.log('Creator: ', creator.publicKey.toBase58());

  const tokenAmount = 10000n * 1000000000n; // Buy 10k tokens

  // Buy example
  const collateralAmount = token.getCollateralAmountByTokensSync({
    tokenAmount,
    tradeDirection: 'BUY',
    curvePosition: curvePos,
  });

  const { ixs } = await token.prepareIxs({
    slippageBps: 500,
    creatorPK: creator.publicKey.toBase58(),
    tokenAmount,
    collateralAmount,
    tradeDirection: 'BUY',
    fixedSide: FixedSide.OUT, // This means you will get exactly the token amount and slippage is applied to collateral amount
  });

  const priorityIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 200_000,
  });

  const blockhash = await connection.getLatestBlockhash('confirmed');
  const messageV0 = new TransactionMessage({
    payerKey: creator.publicKey,
    recentBlockhash: blockhash.blockhash,
    instructions: [priorityIx, ...ixs],
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  transaction.sign([creator]);
  const txHash = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    maxRetries: 0,
    preflightCommitment: 'confirmed',
  });

  console.log('Buy Transaction Hash:', txHash);
};
