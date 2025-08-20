import { Schema, model, Types } from "mongoose";

type SnipeWallet = {
  pubkey: string;
  secret: string;
};

type SnipeToken = {
  address: string;
  name: string;
  ticker: string;
}

type AllWallet = {
  pubkey: string;
  secret: string;
}

type BuyToken = {
  address: string;
  name: string;
  ticker: string;
  price: number;
  liq: number;
  mc: number;
  bondingCurveProgress: number;
  renounced: boolean;
  freeze: boolean;
  buyTokenState: string;
  amount: number;
  buyTip: number;
  autoTip: boolean;
  mevProtect: boolean;
  wallets: [
    {
      address: string,
    },
  ];
}

type SellToken = {
  address: string;  // Token address
  name: string;     // Token name
  ticker: string;   // Token ticker
  tokenAmount: number;   // Token balance
  pubkey: string;   // Wallet public key
  price: number;    // Add price here
  amount: number;
  sellTip: number;
  autoTip: boolean;
  mevProtect: boolean;
};

type SelectedSellToken = {
  address: string;  // Token address
  name: string;     // Token name
  ticker: string;   // Token ticker
  tokenAmount: number;   // Token balance
  pubkey: string;   // Wallet public key
  price: number;    // Add price here
  amount: number;
  sellTip: number;
  autoTip: boolean;
  mevProtect: boolean;
}


const SnipeWalletSchema = new Schema<SnipeWallet>({
  pubkey: { type: String, required: true },
  secret: { type: String, required: true },
});

const AllWalletSchema = new Schema<AllWallet>({
  pubkey: { type: String, required: true },
  secret: { type: String, required: true },
});

const SnipeTokenSchema = new Schema<SnipeToken>({
  address: { type: String, required: true },
  name: { type: String, required: true },
  ticker: { type: String, required: true },
})

const BuyTokenSchema = new Schema<BuyToken>({
  address: { type: String, required: true },
  name: { type: String, required: true },
  ticker: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  liq: { type: Number, required: true, default: 0 },
  mc: { type: Number, required: true, default: 0 },
  bondingCurveProgress: { type: Number, required: true, default: 0 },
  renounced: { type: Boolean, required: true, },
  freeze: { type: Boolean, required: true, },
  buyTokenState: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 },
  buyTip: { type: Number, required: true, default: 0 },
  autoTip: { type: Boolean, required: true },
  mevProtect: { type: Boolean, required: true },
  wallets: [
    {
      address: { type: String, required: true },
    },
  ],
})

const SellTokenSchema = new Schema<SellToken>({
  address: { type: String, required: true },
  name: { type: String, required: true },
  ticker: { type: String, required: true },
  tokenAmount: { type: Number, required: true, default: 0 },
  pubkey: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 },
  sellTip: { type: Number, required: true, default: 0 },
  autoTip: { type: Boolean, required: true },
  mevProtect: { type: Boolean, required: true },
});

const SelectedSellTokenSchema = new Schema<SelectedSellToken>({
  address: { type: String, required: true },
  name: { type: String, required: true },
  ticker: { type: String, required: true },
  tokenAmount: { type: Number, required: true },
  pubkey: { type: String, required: true },
  price: { type: Number, required: true },
  amount: { type: Number, required: true },
  sellTip: { type: Number, required: true, default: 0 },
  autoTip: { type: Boolean, required: true },
  mevProtect: { type: Boolean, required: true },
});

const UserSchema = new Schema(
  {
    username: { type: String, default: "" },
    userId: { type: Number, required: true, unique: true },
    publicKey: { type: String, default: "", index: true },
    privateKey: { type: String, default: "", select: true },
    snipingTokens: { type: [SnipeTokenSchema], default: [] },
    snipingWallets: { type: [SnipeWalletSchema], default: [] },
    allWallets: { type: [AllWalletSchema], default: [] },
    copyingWallets: { type: [String], default: [] },
    limitOrders: { type: [String], default: [] },
    snipingSolAmount: { type: Number, default: 0 },
    buyIntervalMax: { type: Number, default: 0 },
    buyIntervalMin: { type: Number, default: 0 },
    buyToken: { type: [BuyTokenSchema], default: [] },
    sellToken: { type: [SellTokenSchema], default: [] },
    selectedSellToken: { type: [SelectedSellTokenSchema], default: [] },
  },
  { timestamps: true }
);

const UserModel = model("User", UserSchema);

export default UserModel;
