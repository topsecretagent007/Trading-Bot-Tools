
import {
  Connection,
  Keypair,
  VersionedTransaction,
} from '@solana/web3.js';
import { SearcherClient, searcherClient, SearcherClientError } from 'jito-ts/dist/sdk/block-engine/searcher';
import { Bundle } from 'jito-ts/dist/sdk/block-engine/types';
import { isError, Result } from 'jito-ts/dist/sdk/block-engine/utils';
import bs58 from 'bs58';
import { BLOCK_ENGINE_URL, JITO_KEY } from '../configs';
import base58 from 'bs58';
import { sleep } from './utils';

export const sendBundles = async (
  c: SearcherClient,
  transactions: VersionedTransaction[],
  bundleTransactionLimit: number,
  keypair: Keypair,
  connection: Connection
): Promise<Result<string[], SearcherClientError>> => {
  try {
    let isLeaderSlot = false;
    while (!isLeaderSlot) {
      const next_leader = await c.getNextScheduledLeader();
      if (!next_leader.ok) {
        return next_leader;
      }
      const num_slots = next_leader.value.nextLeaderSlot - next_leader.value.currentSlot;
      isLeaderSlot = num_slots <= 2;
      // console.log(`next jito leader slot in ${num_slots} slots`);
      await new Promise(r => setTimeout(r, 1000));
    }

    // const blockHash = await connection.getLatestBlockhash();
    const b = new Bundle([], bundleTransactionLimit);
    // console.log(blockHash.blockhash);

    const bundles = [b];

    let maybeBundle = b.addTransactions(...transactions);
    if (isError(maybeBundle)) {
      return {
        ok: false,
        error: new SearcherClientError(
          3, // INVALID_ARGUMENT
          'Failed to add transactions to bundle',
          maybeBundle.message
        )
      };
    }

    if (isError(maybeBundle)) {
      return {
        ok: false,
        error: new SearcherClientError(
          3, // INVALID_ARGUMENT
          'Failed to add tip transaction to bundle',
          maybeBundle.message
        )
      };
    }

    type BundleResponse = Result<string, SearcherClientError>;
    const results: BundleResponse[] = await Promise.all(
      bundles.map(async b => {
        try {
          const resp = await c.sendBundle(b);
          if (!resp.ok) {
            return resp;
          }
          // console.log('Bundle ID : ', resp.value);
          return resp;
        } catch (e) {
          console.error('error sending bundle:', e);
          return {
            ok: false,
            error: e as SearcherClientError
          };
        }
      })
    );

    // Check if any bundle sends failed
    const error = results.find(r => !r.ok);
    if (error && !error.ok) {
      return { ok: false, error: error.error };
    }

    // At this point we know all results are successful
    const successResults = results.filter((r): r is { ok: true; value: string } => r.ok);
    return { ok: true, value: successResults.map(r => r.value) };

  } catch (e) {
    return {
      ok: false,
      error: e as SearcherClientError
    };
  }
};

export const onBundleResult = (c: SearcherClient) => {
  return c.onBundleResult(
    result => {
      console.log('Received bundle result', result.bundleId);
    },
    e => {
      console.error('Bundle result error:', e);
      throw e;
    }
  );
};

export const executeBundle = async (connection: Connection, transactions: VersionedTransaction[], mode: "buy" | "sell") => {
  const keypair = Keypair.fromSecretKey(bs58.decode(JITO_KEY));
  const bundleTransactionLimit = 5
  const c = searcherClient(BLOCK_ENGINE_URL, keypair);
  await sleep(2000)
  const result = await sendBundles(c, transactions, bundleTransactionLimit, keypair, connection);
  if (!result.ok) {
    console.error('Failed to send bundles:', result.error);
    return;
  }

  console.log('Successfully sent bundles, checking result');
  onBundleResult(c);

  let latestBlockhash = await connection.getLatestBlockhash();

  const bundleSig = base58.encode(transactions[0].signatures[0]);
  const confirmation = await connection.confirmTransaction(
    {
      signature: bundleSig,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      blockhash: latestBlockhash.blockhash,
    },
    'confirmed'
  );

  if (mode == "sell")
    console.log(
      "Wallet sold token in bundle, gathering funds back to main wallets...."
    );
  else
    console.log(
      "Wallets bought the token plz check keypairs in the data.json file in key folder"
    );

  if (confirmation.value.err) {
    console.log("Confirmtaion error");
    return;
  } else {
    return bundleSig;
  }
};
