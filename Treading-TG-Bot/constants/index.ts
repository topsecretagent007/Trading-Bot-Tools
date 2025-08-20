import { UserSettingData } from "../utils";

export const initialUserInfo = {
  privateKey: "",
  publicKey: "",
  snipingTokens: [],
  copyingWallets: [],
  limitOrders: "",
  snipingSolAmount: 0.05,
  buyIntervalMax: 20,
  buyIntervalMin: 10,
}

export const SLIPPAGE = process.env.SLIPPAGE
