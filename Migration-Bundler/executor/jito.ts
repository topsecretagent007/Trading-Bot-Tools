import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import base58 from "bs58";
import axios from "axios";
import { JITO_FEE, RPC_ENDPOINT, RPC_LIL_JITO_ENDPOINT, RPC_WEBSOCKET_ENDPOINT } from "../constants";

const solanaConnection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
})

export const executeJitoTx = async (transactions: VersionedTransaction[], payer: Keypair, commitment: Commitment) => {

  try {
    let latestBlockhash = await solanaConnection.getLatestBlockhash();

    const jitoTxsignature = base58.encode(transactions[0].signatures[0]);

    // Serialize the transactions once here
    const serializedTransactions: string[] = [];
    for (let i = 0; i < transactions.length; i++) {
      const serializedTransaction = base58.encode(transactions[i].serialize());
      serializedTransactions.push(serializedTransaction);
    }

    const endpoints = [
      // 'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
      // 'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
      // 'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
      // 'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
      'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
    ];


    const requests = endpoints.map((url) =>
      axios.post(url, {
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [serializedTransactions],
      })
    );

    console.log('Sending transactions to endpoints...');

    const results = await Promise.all(requests.map((p) => p.catch((e) => e)));

    const successfulResults = results.filter((result) => !(result instanceof Error));

    if (successfulResults.length > 0) {
      console.log("Waiting for response")
      const confirmation = await solanaConnection.confirmTransaction(
        {
          signature: jitoTxsignature,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          blockhash: latestBlockhash.blockhash,
        },
        commitment,
      );


      if (confirmation.value.err) {
        console.log("Confirmtaion error")
        return null
      } else {
        return jitoTxsignature;

      }
    } else {
      console.log(`No successful responses received for jito`);
    }
    return null
  } catch (error) {
    console.log('Error during transaction execution', error);
    return null
  }
}

export const simulateBundle = async (serializedTxs: string[]) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  const data = {
    jsonrpc: "2.0",
    id: 1,
    method: "simulateBundle",
    params: [{ encodedTransactions: serializedTxs }],
  };
  const result = await axios
    .post(RPC_LIL_JITO_ENDPOINT, data, config)
    .then(function (response) {
      // handle success
      console.log("result: ", response.data);
      console.log("result fail or success: ", response.data.result.value.summary)
      console.log("result fail or success: ", response.data.result.value.summary === 'succeeded')
      console.log("transactionresult: ", response.data.result.value.transactionResults);
      if (response.data.result.value.summary === 'succeeded') {
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      // handle error
      console.log("error: ", err);
      return false;
    });
  return result;
};

export const executeJitTx = async (serializedTxs: string[]) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  const data = {
    jsonrpc: "2.0",
    id: 1,
    method: "sendBundle",
    params: [serializedTxs],
  };
  const result = axios
    .post(RPC_LIL_JITO_ENDPOINT, data, config)
    .then(function (response) {
      // handle success
      console.log("Bundle Id : ", response.data.result);
      return response.data.result as string;
    })
    .catch((err) => {
      // handle error
      console.log("Error when sending the bundle", err);
      return null;
    });

  return result;
};
