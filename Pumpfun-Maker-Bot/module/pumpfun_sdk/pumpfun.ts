import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { getGlobalAccount } from "./globalAccount";
import { getBondingCurveAccount } from "./bondingCurveAccount";
import { PumpFunTypes } from "./types";

export class PumpFunSDK {
  private provider: AnchorProvider;
  private connection: Connection;

  constructor(provider: AnchorProvider) {
    this.provider = provider;
    this.connection = provider.connection;
  }

  /**
   * Get the global account for PumpFun protocol
   */
  async getGlobalAccount(commitment?: any) {
    return await getGlobalAccount(this.connection, commitment);
  }

  /**
   * Get bonding curve account for a specific mint
   */
  async getBondingCurveAccount(mint: PublicKey, commitment?: any) {
    return await getBondingCurveAccount(this.connection, mint, commitment);
  }

  /**
   * Get the bonding curve PDA for a mint
   */
  getBondingCurvePDA(mint: PublicKey): PublicKey {
    const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), mint.toBuffer()],
      new PublicKey("PFund111111111111111111111111111111111111111")
    );
    return bondingCurvePDA;
  }

  /**
   * Get the global account PDA
   */
  getGlobalAccountPDA(): PublicKey {
    const [globalAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_account")],
      new PublicKey("PFund111111111111111111111111111111111111111")
    );
    return globalAccountPDA;
  }

  /**
   * Get connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get provider instance
   */
  getProvider(): AnchorProvider {
    return this.provider;
  }
} 