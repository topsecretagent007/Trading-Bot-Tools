import { struct, bool, u64, Layout } from "@coral-xyz/borsh";
import { BN } from "bn.js";

export class BondingCurveAccount {
  public discriminator: bigint;
  public virtualTokenReserves: bigint;
  public virtualSolReserves: bigint;
  public realTokenReserves: bigint;
  public realSolReserves: bigint;
  public tokenTotalSupply: bigint;
  public complete: boolean;

  constructor(
    discriminator: bigint,
    virtualTokenReserves: bigint,
    virtualSolReserves: bigint,
    realTokenReserves: bigint,
    realSolReserves: bigint,
    tokenTotalSupply: bigint,
    complete: boolean
  ) {
    this.discriminator = discriminator;
    this.virtualTokenReserves = virtualTokenReserves;
    this.virtualSolReserves = virtualSolReserves;
    this.realTokenReserves = realTokenReserves;
    this.realSolReserves = realSolReserves;
    this.tokenTotalSupply = tokenTotalSupply;
    this.complete = complete;
  }

  getBuyPrice(amount: bigint): bigint {
    if (this.complete) {
      throw new Error("Curve is complete");
    }

    if (amount <= BigInt(0)) {
      return BigInt(0);
    }

    // Calculate the product of virtual reserves
    let n = this.virtualSolReserves * this.virtualTokenReserves;

    // Calculate the new virtual sol reserves after the purchase
    let i = this.virtualSolReserves + amount;

    // Calculate the new virtual token reserves after the purchase
    let r = n / i + BigInt(1);

    // Calculate the amount of tokens to be purchased
    let s = this.virtualTokenReserves - r;

    // Return the minimum of the calculated tokens and real token reserves
    return s < this.realTokenReserves ? s : this.realTokenReserves;
  }

  getPriceWhenBundleBought(tokenAmount: string, solLamports: string): number {
    const initialStatus = {
      discriminator: BigInt("6966180631402821399"),
      virtualTokenReserves: BigInt("1073000000000000"),
      virtualSolReserves: BigInt("30000000000"),
      realTokenReserves: BigInt("793100000000000"),
      realSolReserves: BigInt("0"),
      tokenTotalSupply: BigInt("1000000000000000"),
      complete: false
    }

    const price = new BN(initialStatus.virtualTokenReserves.toString()).sub(new BN(tokenAmount))
      .div(new BN(initialStatus.virtualSolReserves.toString()).add(new BN(solLamports))).toNumber()
    return 1 / price
  }

  getSellPrice(amount: bigint, feeBasisPoints: bigint): bigint {
    if (this.complete) {
      throw new Error("Curve is complete");
    }

    if (amount <= BigInt(0)) {
      return BigInt(0);
    }

    // Calculate the proportional amount of virtual sol reserves to be received
    let n =
      (amount * this.virtualSolReserves) / (this.virtualTokenReserves + amount);

    // Calculate the fee amount in the same units
    let a = (n * feeBasisPoints) / BigInt(10000);

    // Return the net amount after deducting the fee
    return n - a;
  }

  getCurrentPrice(): number {
    if (this.virtualTokenReserves === BigInt(0)) {
      return 0;
    }
    const price = new BN(this.virtualTokenReserves.toString()).div(new BN(this.virtualSolReserves.toString())).toNumber()
    return 1 / price
  }

  getMarketCapSOL(): bigint {
    if (this.virtualTokenReserves === BigInt(0)) {
      return BigInt(0);
    }

    return (
      (this.tokenTotalSupply * this.virtualSolReserves) /
      this.virtualTokenReserves
    );
  }

  getFinalMarketCapSOL(feeBasisPoints: bigint): bigint {
    let totalSellValue = this.getBuyOutPrice(
      this.realTokenReserves,
      feeBasisPoints
    );
    let totalVirtualValue = this.virtualSolReserves + totalSellValue;
    let totalVirtualTokens = this.virtualTokenReserves - this.realTokenReserves;

    if (totalVirtualTokens === BigInt(0)) {
      return BigInt(0);
    }

    return (this.tokenTotalSupply * totalVirtualValue) / totalVirtualTokens;
  }

  getBuyOutPrice(amount: bigint, feeBasisPoints: bigint): bigint {
    let solTokens =
      amount < this.realSolReserves ? this.realSolReserves : amount;
    let totalSellValue =
      (solTokens * this.virtualSolReserves) /
      (this.virtualTokenReserves - solTokens) +
      BigInt(1);
    let fee = (totalSellValue * feeBasisPoints) / BigInt(10000);
    return totalSellValue + fee;
  }

  public static fromBuffer(buffer: Buffer): BondingCurveAccount {
    const structure: Layout<BondingCurveAccount> = struct([
      u64("discriminator"),
      u64("virtualTokenReserves"),
      u64("virtualSolReserves"),
      u64("realTokenReserves"),
      u64("realSolReserves"),
      u64("tokenTotalSupply"),
      bool("complete"),
    ]);

    let value = structure.decode(buffer);
    return new BondingCurveAccount(
      BigInt(value.discriminator),
      BigInt(value.virtualTokenReserves),
      BigInt(value.virtualSolReserves),
      BigInt(value.realTokenReserves),
      BigInt(value.realSolReserves),
      BigInt(value.tokenTotalSupply),
      value.complete
    );
  }
}
