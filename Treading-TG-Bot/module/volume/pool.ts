import { Market } from "@openbook-dex/openbook";
import { LIQUIDITY_STATE_LAYOUT_V4, LiquidityPoolKeysV4, MARKET_STATE_LAYOUT_V3, SPL_MINT_LAYOUT } from "@raydium-io/raydium-sdk";
import { AccountInfo, Connection, Keypair, PublicKey } from "@solana/web3.js"
import * as spl from '@solana/spl-token';


export class Pool {
    private readonly openbookProgram = new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX');
    private readonly RayLiqPoolv4 = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");
    private poolId: PublicKey | null = null;
    private connection: Connection;
    private mainKp: Keypair | null = null;
    constructor(
        connection: Connection,
    ) {

        this.connection = connection;
    };

    public derivePoolKeys = async (account: AccountInfo<Buffer>, mainKp: Keypair) => {
        this.mainKp = mainKp;

        const info = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data);
        const marketInfo = await this.getMarketInfo(info.marketId);
        if (!marketInfo) return undefined;
        const marketId = info.marketId
        const marketDeco = await this.getDecodedData(marketInfo);
        const { baseMint } = marketDeco;
        const baseMintData = await this.getMintData(baseMint);
        const baseDecimals = await this.getDecimals(baseMintData);
        const ownerBaseAta = await this.getOwnerAta(baseMint, this.mainKp.publicKey);
        const { quoteMint } = marketDeco;
        const quoteMintData = await this.getMintData(quoteMint);
        const quoteDecimals = await this.getDecimals(quoteMintData);
        const ownerQuoteAta = await this.getOwnerAta(quoteMint, this.mainKp.publicKey);
        const authority = PublicKey.findProgramAddressSync(
            [Buffer.from([97, 109, 109, 32, 97, 117, 116, 104, 111, 114, 105, 116, 121])],
            this.RayLiqPoolv4
        )[0];
        const version: 4 | 5 = 4
        const marketVersion: 3 = 3
        const marketAuthority = await this.getVaultSigner(marketId, marketDeco);

        // get/derive all the pool keys
        const poolKeys: LiquidityPoolKeysV4 = {
            version,
            marketVersion,
            programId: this.RayLiqPoolv4,
            baseMint,
            quoteMint,
            // ownerBaseAta,
            // ownerQuoteAta,
            baseDecimals,
            quoteDecimals,
            lpDecimals: baseDecimals,
            authority,
            marketAuthority,
            marketProgramId: this.openbookProgram,
            marketId,
            marketBids: marketDeco.bids,
            marketAsks: marketDeco.asks,
            marketQuoteVault: marketDeco.quoteVault,
            marketBaseVault: marketDeco.baseVault,
            marketEventQueue: marketDeco.eventQueue,
            id: PublicKey.findProgramAddressSync(
                [this.RayLiqPoolv4.toBuffer(), marketId.toBuffer(), Buffer.from('amm_associated_seed', 'utf-8')],
                this.RayLiqPoolv4
            )[0],
            baseVault: PublicKey.findProgramAddressSync(
                [this.RayLiqPoolv4.toBuffer(), marketId.toBuffer(), Buffer.from('coin_vault_associated_seed', 'utf-8')],
                this.RayLiqPoolv4
            )[0],
            // coinVault: PublicKey.findProgramAddressSync(
            //     [this.RayLiqPoolv4.toBuffer(), marketId.toBuffer(), Buffer.from('pc_vault_associated_seed', 'utf-8')],
            //     this.RayLiqPoolv4
            // )[0],
            lpMint: PublicKey.findProgramAddressSync(
                [this.RayLiqPoolv4.toBuffer(), marketId.toBuffer(), Buffer.from('lp_mint_associated_seed', 'utf-8')],
                this.RayLiqPoolv4
            )[0],
            lpVault: PublicKey.findProgramAddressSync(
                [this.RayLiqPoolv4.toBuffer(), marketId.toBuffer(), Buffer.from('temp_lp_token_associated_seed', 'utf-8')],
                this.RayLiqPoolv4
            )[0],
            targetOrders: PublicKey.findProgramAddressSync(
                [this.RayLiqPoolv4.toBuffer(), marketId.toBuffer(), Buffer.from('target_associated_seed', 'utf-8')],
                this.RayLiqPoolv4
            )[0],
            withdrawQueue: PublicKey.findProgramAddressSync(
                [this.RayLiqPoolv4.toBuffer(), marketId.toBuffer(), Buffer.from('withdraw_associated_seed', 'utf-8')],
                this.RayLiqPoolv4
            )[0],
            openOrders: PublicKey.findProgramAddressSync(
                [this.RayLiqPoolv4.toBuffer(), marketId.toBuffer(), Buffer.from('open_order_associated_seed', 'utf-8')],
                this.RayLiqPoolv4
            )[0],
            quoteVault: PublicKey.findProgramAddressSync(
                [this.RayLiqPoolv4.toBuffer(), marketId.toBuffer(), Buffer.from('pc_vault_associated_seed', 'utf-8')],
                this.RayLiqPoolv4
            )[0],
            lookupTableAccount: new PublicKey('11111111111111111111111111111111')
        };

        return poolKeys;
    }

    public getMarketInfo = async (marketId: PublicKey) => {
        let reqs = 0;
        let marketInfo = await this.connection.getAccountInfo(marketId);
        reqs++;

        while (!marketInfo) {
            marketInfo = await this.connection.getAccountInfo(marketId);
            reqs++;
            if (marketInfo) {
                break;
            } else if (reqs > 20) {
                console.log(`Could not get market info..`);

                return null;
            }
        }
        return marketInfo;
    }
    public fetchMarketId = async (baseMint: PublicKey, quoteMint: PublicKey) => {
        const accounts = await this.connection.getProgramAccounts(
            new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
            {
                commitment: "confirmed",
                filters: [
                    { dataSize: MARKET_STATE_LAYOUT_V3.span },
                    {
                        memcmp: {
                            offset: MARKET_STATE_LAYOUT_V3.offsetOf("baseMint"),
                            bytes: baseMint.toBase58(),
                        },
                    },
                    {
                        memcmp: {
                            offset: MARKET_STATE_LAYOUT_V3.offsetOf("quoteMint"),
                            bytes: quoteMint.toBase58(),
                        },
                    },
                ],
            }
        );
        return accounts.map(({ account }) => MARKET_STATE_LAYOUT_V3.decode(account.data))[0].ownAddress
    }
    public getDecodedData = async (marketInfo: {
        executable?: boolean;
        owner?: PublicKey;
        lamports?: number;
        data: any;
        rentEpoch?: number | undefined;
    }) => {
        return Market.getLayout(this.openbookProgram).decode(marketInfo.data);
    }
    public getMintData = async (mint: PublicKey) => {
        return this.connection.getAccountInfo(mint);
    }
    public getDecimals = (mintData: AccountInfo<Buffer> | null) => {
        if (!mintData) throw new Error('No mint data!');

        return SPL_MINT_LAYOUT.decode(mintData.data).decimals;
    }
    public getOwnerAta = async (mint: { toBuffer: () => Uint8Array | Buffer }, publicKey: PublicKey) => {
        const foundAta = PublicKey.findProgramAddressSync(
            [publicKey.toBuffer(), spl.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
            spl.ASSOCIATED_TOKEN_PROGRAM_ID
        )[0];

        return foundAta;
    }
    public getVaultSigner = async (marketId: { toBuffer: any }, marketDeco: { vaultSignerNonce: { toString: () => any } }) => {
        const seeds = [marketId.toBuffer()];
        const seedsWithNonce = seeds.concat(Buffer.from([Number(marketDeco.vaultSignerNonce.toString())]), Buffer.alloc(7));

        return PublicKey.createProgramAddressSync(seedsWithNonce, this.openbookProgram);
    }



}