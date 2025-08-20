import { Connection } from '@solana/web3.js';
import { LiquidityPoolKeysV4, Token, getPdaMetadataKey } from '@raydium-io/raydium-sdk';
import { getMetadataAccountDataSerializer } from '@metaplex-foundation/mpl-token-metadata';
import { MetadataAccountData, MetadataAccountDataArgs } from '@metaplex-foundation/mpl-token-metadata';
import { Serializer } from '@metaplex-foundation/umi/serializers';
import {CHECK_IF_PUMP_FUN, CHECK_IF_SOCIALS, getTokenPriceRaydium } from './helpers';
import { NATIVE_MINT } from '@solana/spl-token';

export interface Filter {
  execute(poolKeysV4: LiquidityPoolKeysV4): Promise<FilterResult>;
}

export interface FilterResult {
  ok: boolean;
  message?: string;
}

export class PumpFilter implements Filter {
  constructor() {}

  async execute(poolKeys: LiquidityPoolKeysV4): Promise<FilterResult> {
    const endsWithPump = (str: string) => str.endsWith('pump');

    if (endsWithPump(poolKeys.baseMint.toString()) || endsWithPump(poolKeys.quoteMint.toString())) {
      return { ok: true };
    } else {
      return { ok: false };
    }
  }
}

export class MutableFilter implements Filter {
  private readonly errorMessage: string[] = [];

  constructor(
    private readonly connection: Connection,
    private readonly metadataSerializer: Serializer<MetadataAccountDataArgs, MetadataAccountData>,
    private readonly checkSocials: boolean,
  ) {
    if (this.checkSocials) {
      this.errorMessage.push('socials');
    }
  }

  async execute(poolKeys: LiquidityPoolKeysV4): Promise<FilterResult> {
    try {
      const metadataPDA = getPdaMetadataKey(poolKeys.baseMint);
      const metadataAccount = await this.connection.getAccountInfo(metadataPDA.publicKey, this.connection.commitment);

      if (!metadataAccount?.data) {
        return { ok: false, message: 'Mutable -> Failed to fetch account data' };
      }

      const deserialize = this.metadataSerializer.deserialize(metadataAccount.data);
      const hasSocials = !this.checkSocials || (await this.hasSocials(deserialize[0]));
      const ok = hasSocials;
      const message: string[] = [];

      if (!hasSocials) {
        message.push('has no socials');
      }

      return { ok: ok, message: ok ? undefined : `MutableSocials -> Token ${message.join(' and ')}` };
    } catch (e) {
      console.log({ mint: poolKeys.baseMint }, `MutableSocials -> Failed to check ${this.errorMessage.join(' and ')}`);
    }

    return {
      ok: false,
      message: `MutableSocials -> Failed to check ${this.errorMessage.join(' and ')}`,
    };
  }

  private async hasSocials(metadata: MetadataAccountData) {
    const response = await fetch(metadata.uri);
    const data = await response.json();
    // @ts-ignore
    return Object.values(data?.extensions ?? {}).some((value: any) => value !== null && value.length > 0);
  }
}


export class MarketCapFilter implements Filter {
  constructor(
    private readonly connection: Connection,
    private readonly minMarketCap: number,
    private readonly maxMarketCap: number,
  ) {}

  async execute(poolKeys: LiquidityPoolKeysV4): Promise<FilterResult> {
    try {
      const token = poolKeys.baseMint.toString()==NATIVE_MINT.toString() ? poolKeys.quoteMint : poolKeys.baseMint
      const supply = await this.connection.getTokenSupply(token);
      const solPrice = await getTokenPriceRaydium(poolKeys, this.connection)
      const mktCapSol = supply.value.uiAmount! * solPrice!
      let inRange = true;
      if (this.maxMarketCap != 0) {
        inRange = mktCapSol <= this.maxMarketCap;

        if (!inRange) {
          return { ok: false, message: `marketcap -> sol mkt cap ${mktCapSol} > ${this.maxMarketCap}` };
        }
      }
      if (this.minMarketCap != 0) {
        inRange = mktCapSol >= this.maxMarketCap;

        if (!inRange) {
          return { ok: false, message: `marketcap -> sol mkt cap ${mktCapSol} < ${this.minMarketCap}` };
        }
      }

      return { ok: inRange };
    } catch (error) {
      console.log({ mint: poolKeys.baseMint }, `Failed to check sol mkt cap`);
    }

    return { ok: false, message: 'PoolSize -> Failed to check sol mkt cap' };
  }
}


export interface PoolFilterArgs {
  minMarketCap: number;
  maxMarketCap: number;
  quoteToken: Token;
}

export class PoolFilters {
  private readonly filters: Filter[] = [];

  constructor(
    readonly connection: Connection,
    readonly args: PoolFilterArgs,
  ) {
    if (CHECK_IF_PUMP_FUN) {
      this.filters.push(new PumpFilter());
    }

    if ( CHECK_IF_SOCIALS) {
      this.filters.push(new MutableFilter(connection, getMetadataAccountDataSerializer(), CHECK_IF_SOCIALS));
    }

    if (args.minMarketCap != 0 || args.maxMarketCap != 0 ) {
      this.filters.push(new MarketCapFilter(connection, args.minMarketCap, args.maxMarketCap));
    }
  }

  public async execute(poolKeys: LiquidityPoolKeysV4): Promise<boolean> {
    if (this.filters.length === 0) {
      return true;
    }

    const result = await Promise.all(this.filters.map((f) => f.execute(poolKeys)));
    const pass = result.every((r) => r.ok);

    if (pass) {
      return true;
    }

    for (const filterResult of result.filter((r) => !r.ok)) {
      console.log(filterResult.message);
    }

    return false;
  }
}
