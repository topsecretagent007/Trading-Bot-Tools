
import { DEBUG_MODE, RPC_ENDPOINT } from "../configs";
import { Keys } from "./interface";
interface Data {
  owner: string,
  amount: string
}
export const findHolders = async (mintStr: string, keysData: Keys, pool: string) => {
  let page = 1;
  let allOwners: Data[] = [];

  while (true) {
    const response = await fetch(RPC_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "getTokenAccounts",
        id: "helius-test",
        params: {
          page: page,
          limit: 1000,
          displayOptions: {},
          mint: mintStr
        },
      }),
    });

    // Check if any error in the response
    if (!response.ok) {
      console.log("Error fetching token holder numbers")
      if (DEBUG_MODE)
        console.log(`Error: ${response.status}, ${response.statusText}`);
      break;
    }

    const data = await response.json();
    if (!data.result || data.result.token_accounts.length === 0) {
      break;
    }
    data.result.token_accounts.forEach((account: any) =>
      allOwners.push({owner: account.owner, amount: account.amount})
    );
    page++;
  }

  console.log("token holders number", allOwners.length)

  const makers = keysData.makers.map(maker => maker.publicKey.toBase58())
  const makersSet = new Set(makers)
  const bundlers = keysData.bundlers.map(bundler => bundler.publicKey.toBase58())
  const bundlerSet = new Set(bundlers)
  const distributedWallets = keysData.tokenWallets.map(distWallet => distWallet.publicKey.toBase58())
  const distSet = new Set(distributedWallets)
  const holderNum = allOwners.length
  console.log("pool:", pool)
  const nonBotBuyers = allOwners.filter(({owner}) => !makersSet.has(owner) && !bundlerSet.has(owner) && !distSet.has(owner) && (owner !== pool))
  
  let totalAmount = BigInt(0)
  nonBotBuyers.map(({amount}) => {
    totalAmount += BigInt(amount)
  })
  
  console.log("Non Bot Buyer number : ", nonBotBuyers.length)
  return {nonBotBuyerNum: nonBotBuyers.length, holderNum, nonBotHoldAmount: totalAmount}
};
