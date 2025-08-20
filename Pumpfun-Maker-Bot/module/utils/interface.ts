import { Keypair, PublicKey } from "@solana/web3.js";

export interface BundleData {
  kp: Keypair,
  lamports: number
}

export interface KeysFileData {
  mintStr: string,
  mainKp: string,
  mint: string,
  lut: string,
  bundlers: string[],
  tokenWallets: string[],
  makers: string[],
  volumes: string[]
}

export interface Keys {
  mintPk: PublicKey,
  mainKp: Keypair,
  mint: Keypair,
  lut: PublicKey | null,
  bundlers: Keypair[],
  tokenWallets: Keypair[],
  makers: Keypair[],
  volumes: Keypair[]
}

export interface LutData {
  mainKp: string,
  lut: string,
  needToClose: boolean
}

export interface Pack {
  bundledWallet: Keypair,
  distributionWallet: Keypair[]
}

export interface ITokenInfo {
  name: string;
  symbol: string;
  description: string;
  showName: string;
  createOn: number;
  twitter: string;
  telegram: string;
  website: string;
  file: string;
}

export interface IWebhookRequestBody {
  data: {
    name: string;
    symbol: string;
    description: string;
    tweet_url: string;
    logo?: string;
  };
}
