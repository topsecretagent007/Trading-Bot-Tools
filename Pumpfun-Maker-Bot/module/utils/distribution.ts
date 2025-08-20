import { ComputeBudgetProgram, Connection, Keypair, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js"
import { DEBUG_MODE } from "../configs"
import { Keys, Pack } from "./interface"
import { sleep } from "./utils"
import { createAssociatedTokenAccountInstruction, createCloseAccountInstruction, createTransferCheckedInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token"

// Distribute SOL to maker or volume wallets
export const distributeSol = async (
  connection: Connection,
  mainKp: Keypair,
  solAmount: number,
  keypairs: Keypair[],
  mode: "maker" | "volume"
) => {
  const data: string[] = []
  try {
    const sendSolTx: TransactionInstruction[] = []
    sendSolTx.push(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: 12_000 })
    )
    const mainSolBal = await connection.getBalance(mainKp.publicKey)
    if (mainSolBal <= 5 * 10 ** 7) {
      console.log("Main wallet balance is not enough")
      return []
    }

    for (let i = 0; i < keypairs.length; i++) {
      const wallet = keypairs[i]
      sendSolTx.push(
        SystemProgram.transfer({
          fromPubkey: mainKp.publicKey,
          toPubkey: wallet.publicKey,
          lamports: solAmount
        })
      )
    }

    try {
      const siTx = new Transaction().add(...sendSolTx)
      const latestBlockhash = await connection.getLatestBlockhash()
      siTx.feePayer = mainKp.publicKey
      siTx.recentBlockhash = latestBlockhash.blockhash

      if (DEBUG_MODE)
        console.log(await connection.simulateTransaction(siTx))

      const txSig = await sendAndConfirmTransaction(connection, siTx, [mainKp], { skipPreflight: true })
      if (txSig) {
        const sig = txSig ? `https://solscan.io/tx/${txSig}` : ''
        // console.log("SOL distributed ", sig)
      }
    } catch (error) {
      console.log("Distribution error")
      if (DEBUG_MODE)
        console.log(error)
      return null
    }

    // console.log("Success in distribution")
    return keypairs
  } catch (error) {
    console.log(`Failed to transfer SOL`)
    if (DEBUG_MODE)
      console.log(error)
    return null
  }
}

export const distributeToken = async (connection: Connection, keysData: Keys) => {
  try {
    const { tokenWallets, bundlers, mintPk } = keysData
    const packs: Pack[] = []
    const walleNumInPack = Math.ceil(tokenWallets.length / bundlers.length)

    for (let i = 0; i < bundlers.length; i++) {
      packs.push({ bundledWallet: bundlers[i], distributionWallet: [] })
      for (let j = 0; j < walleNumInPack; j++) {
        const index = i * walleNumInPack + j
        if (tokenWallets[index])
          packs[i].distributionWallet.push(tokenWallets[index])
      }
    }

    const distTokenProcess = async (pack: Pack, index: number) => {
      try {
        await sleep(index * 1000)
        const { bundledWallet, distributionWallet } = pack
        const transaction = new Transaction().add(
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 }),
          ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
        )
        const srcAta = getAssociatedTokenAddressSync(mintPk, bundledWallet.publicKey)

        if (!(await connection.getAccountInfo(srcAta)))
          return
        const tokenBalInfo = await connection.getTokenAccountBalance(srcAta)

        const transferAmount = BigInt(tokenBalInfo.value.amount) / BigInt(distributionWallet.length)
        for (let i = 0; i < distributionWallet.length; i++) {
          const destWalletKp = distributionWallet[i]
          const destAta = getAssociatedTokenAddressSync(mintPk, destWalletKp.publicKey)

          transaction.add(
            createAssociatedTokenAccountInstruction(bundledWallet.publicKey, destAta, destWalletKp.publicKey, mintPk),
            createTransferCheckedInstruction(srcAta, mintPk, destAta, bundledWallet.publicKey, transferAmount, tokenBalInfo.value.decimals)
          )
        }

        transaction.feePayer = bundledWallet.publicKey
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        if (DEBUG_MODE)
          console.log(await connection.simulateTransaction(transaction))
        const sig = await sendAndConfirmTransaction(connection, transaction, [bundledWallet], { skipPreflight: true })

        console.log(`One of the sub bundle wallet token distributed : https://solscan.io/tx/${sig}`)
      } catch (error) {
        console.log("Error in on of the sub bundle wallet token distribution")
        if (DEBUG_MODE)
          console.log(error)
      }
    }
    const tokenDistributionProcesses = packs.map(async (pack, i) => await distTokenProcess(pack, i))

    await Promise.all(tokenDistributionProcesses)
    return true
  } catch (error) {
    console.log("Error in bundle wallet token distribution")
    if (DEBUG_MODE)
      console.log(error)
    return false
  }
}


export const gatherToken = async (connection: Connection, keysData: Keys) => {
  try {
    const { tokenWallets, bundlers, mintPk } = keysData
    const packs: Pack[] = []
    const walleNumInPack = Math.ceil(tokenWallets.length / bundlers.length)
    for (let i = 0; i < bundlers.length; i++) {
      packs.push({ bundledWallet: bundlers[i], distributionWallet: [] })
      for (let j = 0; j < walleNumInPack; j++) {
        const index = i * walleNumInPack + j
        if (tokenWallets[index])
          packs[i].distributionWallet.push(tokenWallets[index])
      }
    }

    const gatherTokenProcess = async (pack: Pack, index: number) => {
      try {
        await sleep(index * 1000)
        const { bundledWallet, distributionWallet: gatheringWallet } = pack
        const transaction = new Transaction().add(
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 }),
          ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
        )
        const srcAta = getAssociatedTokenAddressSync(mintPk, bundledWallet.publicKey)

        const signers: Keypair[] = []
        for (let i = 0; i < gatheringWallet.length; i++) {
          const destWalletKp = gatheringWallet[i]
          const destAta = getAssociatedTokenAddressSync(mintPk, destWalletKp.publicKey)
          const tokenAtaInfo = await connection.getAccountInfo(destAta)
          if (!tokenAtaInfo)
            continue
          const tokenBalInfo = await connection.getTokenAccountBalance(destAta)
          transaction.add(
            createTransferCheckedInstruction(destAta, mintPk, srcAta, destWalletKp.publicKey, BigInt(tokenBalInfo.value.amount), tokenBalInfo.value.decimals),
            createCloseAccountInstruction(destAta, bundledWallet.publicKey, destWalletKp.publicKey)
          )
          signers.push(destWalletKp)
        }

        if (signers.length == 0)
          return true

        transaction.feePayer = bundledWallet.publicKey
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        if (DEBUG_MODE)
          console.log(await connection.simulateTransaction(transaction))
        const sig = await sendAndConfirmTransaction(connection, transaction, [bundledWallet, ...signers], { skipPreflight: true })

        console.log(`One of the sub bundle wallet token gathered : https://solscan.io/tx/${sig}`)
      } catch (error) {
        console.log("Error in on of the sub bundle wallet token gathering process")
        if (DEBUG_MODE)
          console.log(error)
        return false
      }
    }
    const tokenGatheringProcesses = packs.map(async (pack, i) => await gatherTokenProcess(pack, i))

    await Promise.all(tokenGatheringProcesses)
    return true
  } catch (error) {
    console.log("Error in bundle wallet token gathering")
    if (DEBUG_MODE)
      console.log(error)
    return false
  }
}
