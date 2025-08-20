import { LiquidityStateV4 } from '@raydium-io/raydium-sdk';

export class PoolCache {
  private readonly keys: Map<string, { id: string; state: LiquidityStateV4 }> = new Map<
    string,
    { id: string; state: LiquidityStateV4 }
  >();

  public save(id: string, state: LiquidityStateV4) {
    if (!this.keys.has(state.baseMint.toString())) {
      console.log(`Caching new pool for mint: ${state.baseMint.toString()}`);
      this.keys.set(state.baseMint.toString(), { id, state });
    }
  }

  public async get(mint: string): Promise<{ id: string; state: LiquidityStateV4 }> {
    return this.keys.get(mint)!;
  }
}
