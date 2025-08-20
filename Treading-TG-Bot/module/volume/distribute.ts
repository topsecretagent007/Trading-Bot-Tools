import { ComputeBudgetProgram, Connection, Keypair, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

export interface walletInfo {
    kp: Keypair,
    buyAmount: number,
}
export interface Blockhash {
    blockhash: string;
    lastValidBlockHeight: number;
}

export class DistributeSol {
    private distributionNum: number;
    private connection: Connection;
    wallets: walletInfo[] = [];
    mainKp: Keypair;

    constructor(
        walletNum: number,
        connection: Connection,
        mainKp: Keypair
    ) {
        this.distributionNum = walletNum;
        this.connection = connection;
        this.mainKp = mainKp;
    }
    public async distribute() {
        const sendSolTx: TransactionInstruction[] = [];
        sendSolTx.push(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 250_000 })
        )
        const mainSolBal = await this.connection.getBalance(this.mainKp.publicKey)

        if (mainSolBal <= 4 * 10 ** 6) {
            console.log("Main wallet balance is not enough")
            return []
        }
        let solAmount = Math.floor((mainSolBal - 5 * 10 ** 6) / this.distributionNum)
        for (let i = 0; i < this.distributionNum; i++) {

            const wallet = Keypair.generate()
            this.wallets.push({ kp: wallet, buyAmount: solAmount })

            sendSolTx.push(
                SystemProgram.transfer({
                    fromPubkey: this.mainKp.publicKey,
                    toPubkey: wallet.publicKey,
                    lamports: solAmount
                })
            )
        }
        let index = 0
        while (true) {
            try {
                if (index > 5) {
                    console.log("Error in distribution")
                    return null
                }
                const siTx = new Transaction().add(...sendSolTx)
                const latestBlockhash = await this.connection.getLatestBlockhash()
                siTx.feePayer = this.mainKp.publicKey
                siTx.recentBlockhash = latestBlockhash.blockhash
                const messageV0 = new TransactionMessage({
                    payerKey: this.mainKp.publicKey,
                    recentBlockhash: latestBlockhash.blockhash,
                    instructions: sendSolTx,
                }).compileToV0Message()
                const transaction = new VersionedTransaction(messageV0)
                transaction.sign([this.mainKp])
                let txSig = await this.execute(transaction, latestBlockhash, 1)
                if (txSig) {
                    const distibuteTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
                    console.log("SOL distributed ", distibuteTx)
                    break
                }
                index++
            } catch (error) {
                index++
            }
        }
    }
    public async execute(transaction: VersionedTransaction, latestBlockhash: Blockhash, isBuy: boolean | 1 = true) {
        const signature = await this.connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true });
        const confirmation = await this.connection.confirmTransaction(
            {
                signature,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                blockhash: latestBlockhash.blockhash,
            }
        );
        if (confirmation.value.err) {
            console.log("Confirmtaion error")
            return ""
        } else {
            if (isBuy === 1) {
                return signature
            } else if (isBuy)
                console.log(`Success in buy transaction: https://solscan.io/tx/${signature}`)
            else
                console.log(`Success in Sell transaction: https://solscan.io/tx/${signature}`)
        }
        return signature
    }

}