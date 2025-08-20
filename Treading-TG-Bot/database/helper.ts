import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import UserModel from "./model"
import { UserSettingData } from "../utils";
import { RPC_ENDPOINT } from "../config";
import bs58 from "bs58";
import { getTokenMetadata } from "../commands/basic";
import { MintLayout } from "@solana/spl-token";
import { helper } from ".";
import { Types } from "mongoose";

const connection = new Connection(RPC_ENDPOINT);
const userStates: Record<number, string | null> = {};
export type SellToken = {
  address: string;
  name: string;
  ticker: string;
};

// export const start = async (userId: number, username?: string) => {
//   try {
//     const amount = userData[userId] ?? 0
//     const info = await UserModel.findOneAndUpdate({ userId }, { userId, username, amount }, { upsert: true })
//     return amount
//   } catch (e) {
// console.log("Error ", e)
//     return 0
//   }
// }


export const saveInfo = async (userId: number, userData: UserSettingData) => {
  try {
    console.log(`${userId} is trying to save user data to db`);

    // ✅ Ensure user doesn't already exist, if yes -> update, otherwise create
    const updatedUser = await UserModel.findOneAndUpdate(
      { userId },                // Find by userId
      { $set: userData },        // Update user data
      { upsert: true, new: true, setDefaultsOnInsert: true } // Create if not exists
    );

    console.log(`${userId} successfully saved/updated in DB`);
    return updatedUser;
  } catch (error) {
    console.error(`${userId} ❌ Error saving userData to DB:`, error);
    return null;
  }
};

export const setWallet = async (userId: number, privateKey: string, publicKey: string) => {
  try {
    const data = await UserModel.findOneAndUpdate(
      { userId },
      { privateKey, publicKey },
      { new: true, upsert: true }
    );
    if (!data) {
      console.error(`User with userId: ${userId} not found or updated`);
      return null;
    }

    console.log(`${userId} successfully updated wallet in DB`);
    return data.publicKey;
  } catch (e) {
    console.log("Error ", e)
    return undefined
  }
}

export const findUser = async (userId: number, username?: string) => {
  try {
    const info = await UserModel.findOne({ userId })
    return info;
  } catch (e) {
    console.log("Error ", e)
    return null
  }
}

export const findOne = async (userId: number) => {
  try {
    return await UserModel.findOne({ userId });
  } catch (error) {
    console.error(`Error fetching sniper token for ${userId}:`, error);
    return null;
  }
};

// export const findUser = async (userId: number, username?: string): UserSettingData | null => {
//   // Create a timeout promise that resolves to null if it takes too long
//   const timeout = new Promise((resolve) => {
//     setTimeout(() => {
//       console.log('findUser operation timed out');
//       resolve(null);
//     }, 1000); // 1 second timeout
//   });

//   // Fetch user info with Promise.race to limit execution to 1 second
//   const findUserPromise = UserModel.findOne({ userId });

//   try {
//     const userInfo: UserSettingData | null = await Promise.race([findUserPromise, timeout]); // whichever comes first
//     return userInfo; // This could be the user data or null (if timeout happens first)
//   } catch (e) {
//     console.log('Error', e);
//     return null;
//   }
// };



export const addressAddDB = async (userId: number, privateKey: string, publicKey: string) => {
  try {
    const data = await UserModel.findOneAndUpdate({ userId }, { userId, privateKey, publicKey }, { new: true, upsert: true });
    console.log("123131================", data);
    return data.publicKey;
  } catch (e) {
    console.log("Error ", e)
    return undefined
  }
}


export const updateUserData = async (userId: number, newData: any) => {
  try {
    console.log("121111111")
    const data = await UserModel.findOneAndUpdate({ userId }, { ...newData }, { new: true });
    console.log("data")
    if (data) {
      console.log("123131================", data);
      return data.publicKey;
    }
  } catch (e) {
    console.log("Error ", e)
    return undefined
  }
}

export const updateSolAmount = async (userId: number, solAmount: number) => {
  try {
    console.log("121111111")
    const data = await UserModel.findOneAndUpdate({ userId }, { solAmount }, { new: true });
    console.log("data")
    if (data) {
      console.log("123131================", data);
      return data.publicKey;
    }
  } catch (e) {
    console.log("Error ", e)
    return undefined
  }
}

export const updateTokenAddr = async (userId: number, tokenAddr: String) => {
  try {
    const data = await UserModel.findOneAndUpdate({ userId }, { userId, tokenAddr }, { new: true, upsert: true });
  } catch (e) {
    console.log("Error ", e)
    return undefined
  }
}

export const updateDistributionWalletNum = async (userId: number, distributeWalletNum: number) => {
  try {
    const data = await UserModel.findOneAndUpdate({ userId }, { userId, distributeWalletNum }, { new: true, upsert: true });
  } catch (e) {
    console.log("Error ", e)
    return undefined
  }
}

export const updateBuyUpperAmount = async (userId: number, buyUpperAmount: number) => {
  try {
    const data = await UserModel.findOneAndUpdate({ userId }, { userId, buyUpperAmount }, { new: true, upsert: true });
  } catch (e) {
    console.log("Error ", e)
    return undefined
  }
}

export const updateBuyLowerAmount = async (userId: number, buyLowerAmount: number) => {
  try {
    const data = await UserModel.findOneAndUpdate({ userId }, { userId, buyLowerAmount }, { new: true, upsert: true });
  } catch (e) {
    console.log("Error ", e)
    return undefined
  }
}

export const updateBuyIntervalMax = async (userId: number, buyIntervalMax: number) => {
  try {
    const data = await UserModel.findOneAndUpdate({ userId }, { userId, buyIntervalMax }, { new: true, upsert: true });
  } catch (e) {
    console.log("Error ", e)
    return undefined
  }
}

export const updateBuyIntervalMin = async (userId: number, buyIntervalMin: number) => {
  try {
    const data = await UserModel.findOneAndUpdate({ userId }, { userId, buyIntervalMin }, { new: true, upsert: true });
  } catch (e) {
    console.log("Error ", e)
    return undefined
  }
}

export const updateSellAllByTimes = async (userId: number, sellAllByTimes: number) => {
  try {
    const data = await UserModel.findOneAndUpdate({ userId }, { userId, sellAllByTimes }, { new: true, upsert: true });
  } catch (e) {
    console.log("Error ", e)
    return undefined
  }
}

export const updateSlippage = async (userId: number, slippage: number) => {
  try {
    const data = await UserModel.findOneAndUpdate({ userId }, { userId, slippage }, { new: true, upsert: true });
  } catch (e) {
    console.log("Error ", e)
    return undefined
  }
}

export const addSnipingToken = async (userId: number, token: string) => {
  try {
    const user = await UserModel.findOne({ userId });
    if (!user) {
      console.log("User data does not exist");
      return;
    }

    // ✅ Check if token already exists
    if (user.snipingTokens.some(t => t.address === token)) {
      console.log("Already added token");
      return false;
    }

    // ✅ Fetch Token Metadata
    const { name, ticker } = await getTokenMetadata(token);

    // ✅ Add new token to the list
    const updatedUser = await UserModel.findOneAndUpdate(
      { userId },
      { $push: { snipingTokens: { address: token, name, ticker } } },
      { new: true }
    );

    console.log(`${userId} => Added sniping token: ${name} (${ticker})`);
    return updatedUser?.snipingTokens;
  } catch (error) {
    console.error("❌ Error while adding sniping token:", error);
    return;
  }
};

export const addWallets = async (userId: number, keypair: any) => {
  try {
    // 🔹 Fetch user data from the database
    const user = await UserModel.findOne({ userId });
    if (!user) {
      console.log(`❌ User with userId: ${userId} does not exist.`);
      return null;
    }

    // ✅ Check if token already exists
    if (user.allWallets.some(t => t.pubkey === keypair.pubkey)) {
      console.log("Already added token");
      return false;
    }

    // 🔹 Convert secret key to string safely
    const secretKeyString = Buffer.isBuffer(keypair.secretKey)
      ? keypair.secretKey.toString('hex') // Store in hex to avoid issues
      : keypair.secretKey;

    // 🔹 Check if the wallet is already added
    if (user.allWallets.some(wallet => wallet.secret === secretKeyString)) {
      console.log("⚠️ Wallet already added.");
      return false;
    }

    // 🔹 Derive the public key from the secret key
    const publicKey = keypair.publicKey.toBase58();

    // 🔹 Create the new wallet object
    const newWallet = {
      pubkey: publicKey,
      secret: secretKeyString
    };

    // ✅ Add new token to the list
    const updatedUser = await UserModel.findOneAndUpdate(
      { userId },
      {
        $push: {
          allWallets: newWallet
        }
      },
      { new: true }
    );

    console.log("✅ New Wallet:", newWallet);

    // 🔹 Log updated sniping wallet list
    const allWallets = user.allWallets.map(wallet => `${wallet.pubkey},\n`).join("");
    console.log(`${userId} => Updated sniping wallet list:\n${allWallets}`);

    return user.allWallets;
  } catch (error: any) {
    console.error("❌ Error while adding sniping wallet:", error.message);
    return null;
  }
};

export const updateAddWallets = async (userId: number, allWalletData: any[]) => {
  try {
    const user = await UserModel.findOne({ userId });
    console.log("user ==>", user)
    if (!user) {
      console.log(`❌ User with userId: ${userId} does not exist.`);
      return null;
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          allWallets: allWalletData
        }
      },
      { new: true }
    );


  } catch (err: any) {
    console.error("❌ Error while updating wallet:", err.message);
    return null;
  }
}

export const deleteSnipingToken = async (userId: number) => {
  try {
    const info = await UserModel.findOne({ userId });
    if (!info || !info.snipingTokens.length) {
      console.log("No sniping tokens found to delete.");
      return false;
    }

    // Remove the first token from the list
    const updatedTokens = info.snipingTokens.slice(1);

    // Update the database
    await UserModel.findOneAndUpdate({ userId }, { snipingTokens: updatedTokens });

    console.log(`Deleted first sniping token for user ${userId}.`);
    return updatedTokens; // Return updated list after deletion
  } catch (error) {
    console.error("Error deleting sniping token:", error);
    return false;
  }
};

export const deleteAllSnipingTokens = async (userId: number) => {
  try {
    const info = await UserModel.findOne({ userId });
    if (!info || !info.snipingTokens.length) {
      console.log("No sniping tokens found to delete.");
      return false;
    }

    // Remove all tokens
    await UserModel.findOneAndUpdate({ userId }, { snipingTokens: [] });

    console.log(`Deleted all sniping tokens for user ${userId}.`);
    return true; // Return success
  } catch (error) {
    console.error("Error deleting all sniping tokens:", error);
    return false;
  }
};

export const addTargetWallet = async (chatId: number, wallet: string) => {
  try {
    const info = await UserModel.findOne({ chatId })
    if (!info) {
      console.log("User data does not exist")
      return
    }

    if (info.copyingWallets.includes(wallet)) {
      console.log('Already added token')
      return false
    }
    const data = await UserModel.findOneAndUpdate({ chatId }, { copyingWallets: [wallet, ...info.copyingWallets] }, { new: true })

    const updatedInfo = await UserModel.findOne({ chatId })
    const string = ""
    const copyingWallets = updatedInfo!.copyingWallets.map(ca => string.concat(ca).concat(',\n'))
    console.log(`${chatId} => sniping token lists, ${copyingWallets}`)
    if (!data)
      return
    else
      return data.copyingWallets
  } catch (error) {
    console.log("Error while fetching")
    return
  }
}

export const validateTokenAddress = async (token: string): Promise<boolean> => {
  console.log(`Checking token: ${token}`);

  try {
    bs58.decode(token);
  } catch (error: any) {
    console.error("❌ Invalid base58 encoding:", error.message);
    return false;
  }

  try {
    new PublicKey(token);
  } catch (error: any) {
    console.error("❌ Invalid Solana public key:", error.message);
    return false;
  }

  console.log("✅ Token is valid!");
  return true;
};

export const validateWalletAddress = async (wallet: string): Promise<string | false> => {
  console.log(`🔍 Checking input: ${wallet}`);

  let publicKey: PublicKey;

  try {
    // 🔹 Decode Base58 input
    const decoded = bs58.decode(wallet);

    // 🔹 If input is a **Private Key** (64 bytes), derive the Public Key
    if (decoded.length === 64) {
      console.log("🔹 Detected Private Key → Deriving Public Key...");
      const keypair = Keypair.fromSecretKey(decoded);
      publicKey = keypair.publicKey;
    }
    // 🔹 If input is a **Public Key** (32 bytes), validate it
    else if (decoded.length === 32) {
      publicKey = new PublicKey(wallet);
    }
    // ❌ Invalid key format
    else {
      console.error("❌ Input is neither a valid Private Key (64 bytes) nor a Public Key (32 bytes).");
      return false;
    }

    console.log("✅ Valid Solana wallet address:", publicKey.toBase58());
    return publicKey.toBase58();
  } catch (error: any) {
    console.error("❌ Invalid Solana key format:", error.message);
    return false;
  }
};

export const isTokenAlreadyAdded = async (userId: number, token: string): Promise<boolean> => {
  try {
    const user = await UserModel.findOne({ userId });
    if (!user) return false;

    return user.snipingTokens.some(t => t.address === token); // Corrected check
  } catch (error) {
    console.error("❌ Error checking token in database:", error);
    return false;
  }
};

export const isWalletAlreadyAdded = async (userId: number, walletAddress: string): Promise<boolean> => {
  try {
    // 🔹 Fetch user data from the database
    const user = await UserModel.findOne({ userId });
    if (!user) {
      console.log(`❌ User with userId: ${userId} does not exist.`);
      return false; // User not found, token can't be in database
    }

    // 🔹 Check if the private key already exists in the sniping wallets
    const walletExists = user.snipingWallets.some(wallet => wallet.secret === walletAddress);

    return walletExists; // Return whether the wallet already exists in the user's list
  } catch (error: any) {
    console.error("❌ Error checking token in database:", error.message);
    return false; // If error occurs, assume wallet is not added
  }
};

export const setUserState = (chatId: number, state: string | null) => {
  userStates[chatId] = state;
};

export const getUserState = (chatId: number): string | null => {
  return userStates[chatId] || null;
};


export const getTokenOwnershipStatus = async (mintAddress: PublicKey) => {
  try {
    const mintAccountInfo = await connection.getAccountInfo(mintAddress);

    if (!mintAccountInfo) {
      throw new Error("Token mint account not found.");
    }

    const mintData = MintLayout.decode(mintAccountInfo.data);

    const mintAuthority = mintData.mintAuthorityOption ? new PublicKey(mintData.mintAuthority) : null;
    const freezeAuthority = mintData.freezeAuthorityOption ? new PublicKey(mintData.freezeAuthority) : null;

    return {
      isRenounced: mintAuthority === null ? "✅" : "❌",
      isFreeze: freezeAuthority ? "✅" : "❌",
    };
  } catch (error: any) {
    console.warn("⚠️ Failed to fetch token ownership status:", error.message);
    return { isRenounced: "❌", isFreeze: "❌" }; // Assume false if an error occurs
  }
};

// export const setUserToken = async (chatId: number, tokenAddress: string): Promise<void> => {
//   try {
//     await UserModel.findOneAndUpdate(
//       { userId: chatId },
//       { $set: { tokenAddress } },
//       { new: true, upsert: true }
//     );
//   } catch (error) {
//     console.error('Error updating user token:', error);
//   }
// };

export const getUserToken = async (
  chatId: number
): Promise<{
  buyToken: string; name: string; ticker: string
} | null> => {
  try {
    // Fetch the user data and select the tokenAddress and other fields
    const user = await UserModel.findOne({ userId: chatId });
    console.log("user  ===>", user)


    // Check if the user exists and has at least one token
    if (user && user.buyToken && user.buyToken.length > 0) {
      const token = user.buyToken[0];
      console.log("token  ===>", token)

      // Return the relevant information for that token
      return {
        buyToken: token.address,
        name: token.name,
        ticker: token.ticker,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching user token:", error);
    return null;
  }
};

export const saveTokenData = async (
  chatId: number,
  tokenData: { address: string; name: string; ticker: string; amount: number; pubkey: string; }
) => {
  try {
    // 🔹 Find user in DB
    const user = await UserModel.findOne({ userId: chatId });
    if (!user) {
      console.error("User not found!");
      return;
    }

    // 🔹 Check if token already exists in sellToken list
    const existingTokenIndex = user.sellToken.findIndex(t => t.address === tokenData.address && t.pubkey === tokenData.pubkey);

    if (existingTokenIndex !== -1) {
      // 🔹 Update existing token balance
      user.sellToken[existingTokenIndex].tokenAmount = tokenData.amount;
    } else {
      // 🔹 Add new token entry
      user.sellToken.push(tokenData);
    }

    // 🔹 Save updated user document
    await user.save();
    console.log("✅ Token data saved successfully:", tokenData);
  } catch (error) {
    console.log("❌ Error saving token data:", error);
  }
};

export const getTokensForSale = async (tokenId: string | number): Promise<SellToken[] | null> => {
  try {
    // Find the user by their userId
    const user = await UserModel.findOne({ userId: tokenId });

    if (!user) {
      console.error('User not found!');
      return null;
    }

    // Return the sellToken array
    return user.sellToken;
  } catch (error) {
    console.error('Error retrieving tokens for sale:', error);
    return null;
  }
};

export const addWalletToTokenAddress = async (chatId: number, walletAddress: string) => {
  await UserModel.updateOne(
    { userId: chatId },
    { $push: { "tokenAddress.$.wallets": { address: walletAddress, solAmount: 0 } } }
  );
};

export const removeWalletFromTokenAddress = async (chatId: number, walletAddress: string) => {
  await UserModel.updateOne(
    { userId: chatId },
    { $pull: { "tokenAddress.$.wallets": { address: walletAddress } } }
  );
};

export async function updateUserBuyToken(
  chatId: number,
  { buyToken }: {
    buyToken: Types.DocumentArray<{
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
    }>
  }
) {
  try {
    // Find the user in the database
    const userInfo = await UserModel.findOne({ userId: chatId });
    if (!userInfo) {
      throw new Error("User not found in the database");
    }

    // Use findOneAndUpdate to update the tokenAddress field
    await UserModel.findOneAndUpdate(
      { userId: chatId },  // Query to find the user by their chatId
      { $set: { buyToken } },  // Use $set to update tokenAddress field
      { new: true }  // Return the updated document
    );

    console.log("User data updated successfully with new tokenAddress");
    return userInfo;  // Optionally return the updated user info
  } catch (error: any) {
    console.error("❌ Error updating user data:", error.message);
    throw error;
  }
}

export async function updateUserSelectedSellToken(
  chatId: number,
  { selectedSellToken }: {
    selectedSellToken: Types.DocumentArray<{
      address: string;
      name: string;
      ticker: string;
      tokenAmount: number;
      pubkey: string;
      price: number;
      amount: number;
      sellTip: number;
      autoTip: boolean;
      mevProtect: boolean;
    }>
  }
) {
  try {
    // Find the user in the database
    const userInfo = await UserModel.findOne({ userId: chatId });
    if (!userInfo) {
      throw new Error("User not found in the database");
    }

    // Use findOneAndUpdate to update the tokenAddress field
    await UserModel.findOneAndUpdate(
      { userId: chatId },  // Query to find the user by their chatId
      { $set: { selectedSellToken } },  // Use $set to update tokenAddress field
      { new: true }  // Return the updated document
    );

    console.log("User data updated successfully with new tokenAddress");
    return userInfo;  // Optionally return the updated user info
  } catch (error: any) {
    console.error("❌ Error updating user data:", error.message);
    throw error;
  }
}


