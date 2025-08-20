import { ComputeBudgetProgram, Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, createCloseAccountInstruction, createTransferCheckedInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { SPL_ACCOUNT_LAYOUT, TokenAccount } from "@raydium-io/raydium-sdk";
import base58 from "bs58"

import { readJson, saveNewFile, sleep } from "./utils"
import { getSellTxWithJupiter } from "./utils/swapOnlyAmm"; 
import { execute } from "./executor/legacy";
import { PRIVATE_KEY, RPC_ENDPOINT } from "./constants";


const connection = new Connection(RPC_ENDPOINT, { commitment: "confirmed" });
const mainKp = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY))

const main = async () => {
  const walletsData = readJson()

  const wallets = walletsData.map(({ privateKey }) => Keypair.fromSecretKey(base58.decode(privateKey)))
  wallets.map(async (kp, i) => {
    try {
      const solBalance = await connection.getBalance(kp.publicKey)
      if (solBalance > 0)
        console.log("Wallet ", kp.publicKey.toBase58(), " SOL balance is ", (solBalance / 10 ** 9).toFixed(4))
      await sleep(i * 50)
      const accountInfo = await connection.getAccountInfo(kp.publicKey)

      const tokenAccounts = await connection.getTokenAccountsByOwner(kp.publicKey, {
        programId: TOKEN_PROGRAM_ID,
      },
        "confirmed"
      )
      const ixs: TransactionInstruction[] = []
      const accounts: TokenAccount[] = [];

      if (tokenAccounts.value.length > 0)
        for (const { pubkey, account } of tokenAccounts.value) {
          accounts.push({
            pubkey,
            programId: account.owner,
            accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
          });
        }

      for (let j = 0; j < accounts.length; j++) {
        const baseAta = await getAssociatedTokenAddress(accounts[j].accountInfo.mint, mainKp.publicKey)
        const tokenAccount = accounts[j].pubkey
        const tokenBalance = (await connection.getTokenAccountBalance(accounts[j].pubkey)).value
        console.log("Token balance : ", tokenBalance.uiAmount)

        let i = 0
        while (true) {
          if (i > 5) {
            console.log("Sell error before gather")
            break
          }
          if (tokenBalance.uiAmount == 0) {
            break
          }
          try {
            const sellTx = await getSellTxWithJupiter(kp, accounts[j].accountInfo.mint, tokenBalance.amount)
            if (sellTx == null) {
              // console.log(`Error getting sell transaction`)
              throw new Error("Error getting sell tx")
            }
            const latestBlockhashForSell = await connection.getLatestBlockhash()
            const txSellSig = await execute(sellTx, latestBlockhashForSell, false)
            const tokenSellTx = txSellSig ? `https://solscan.io/tx/${txSellSig}` : ''
            console.log("Sold token, ", tokenSellTx)
            break
          } catch (error) {
            i++
          }
        }
        await sleep(1000)

        const tokenBalanceAfterSell = (await connection.getTokenAccountBalance(accounts[j].pubkey)).value
        if (tokenBalanceAfterSell.uiAmount && tokenBalanceAfterSell.uiAmount > 0) {
          console.log("Token Balance After Sell:", kp.publicKey.toBase58(), tokenBalanceAfterSell.amount)
          ixs.push(createAssociatedTokenAccountIdempotentInstruction(mainKp.publicKey, baseAta, mainKp.publicKey, accounts[j].accountInfo.mint))
          ixs.push(createTransferCheckedInstruction(tokenAccount, accounts[j].accountInfo.mint, baseAta, kp.publicKey, BigInt(tokenBalanceAfterSell.amount), tokenBalance.decimals))
        }
        ixs.push(createCloseAccountInstruction(tokenAccount, mainKp.publicKey, kp.publicKey))
      }

      if (accountInfo) {
        const solBal = await connection.getBalance(kp.publicKey)
        ixs.push(
          SystemProgram.transfer({
            fromPubkey: kp.publicKey,
            toPubkey: mainKp.publicKey,
            lamports: solBal
          })
        )
      }

      if (ixs.length) {
        const tx = new Transaction().add(
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_200_000 }),
          ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
          ...ixs,
        )
        tx.feePayer = mainKp.publicKey
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        const sig = await sendAndConfirmTransaction(connection, tx, [mainKp, kp], { commitment: "confirmed" })
        console.log(`Closed and gathered SOL from wallets ${i} : https://solscan.io/tx/${sig}`)
        return
      }

      // filter the keypair that is completed (after this procedure, only keypairs with sol or ata will be saved in data.json)
      const bal = await connection.getBalance(kp.publicKey)
      if (bal == 0) {
        const tokenAccounts = await connection.getTokenAccountsByOwner(kp.publicKey, {
          programId: TOKEN_PROGRAM_ID,
        },
          "confirmed"
        )
        if (tokenAccounts.value.length == 0) {
          const walletsData = readJson()
          const wallets = walletsData.filter(({ privateKey }) => base58.encode(kp.secretKey) != privateKey)
          saveNewFile(wallets)
          console.log("Wallet closed completely")
        }
      }


    } catch (error) {
      console.log("transaction error while gathering")
      return
    }
  })
}

main()