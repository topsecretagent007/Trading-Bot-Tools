
export interface BotMsgResult {
  title: string;
  content: {
    text: string;
    callback_data: string;
  }[][];
}

export interface UserSettingData {
  username: string;
  userId: Number;
  privateKey: string;
  publicKey: string;
  snipingTokens: string[];
  copyingWallets: string[];
  allWallets: [];
  limitOrders: string;
  snipingSolAmount: Number;
  buyIntervalMax: Number;
  buyIntervalMin: Number;
  buyToken: string[];
  sellToken: string[];
}

