const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token');

class HeavenDEXBot {
  constructor(config) {
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    this.wallet = Keypair.fromSecretKey(Buffer.from(config.walletKey, 'base64'));
    this.config = config;
  }

  /**
   * Launch a new token on Heaven DEX
   * @param {Object} tokenConfig - Token configuration
   * @returns {Object} - Result with mint address and transaction
   */
  async launchToken(tokenConfig) {
    try {
      console.log('🚀 Starting token launch process...');
      
      // Create token mint
      const mint = await this.createTokenMint(tokenConfig);
      
      // Create associated token account
      const associatedTokenAccount = await this.createAssociatedTokenAccount(mint);
      
      // Mint initial supply
      await this.mintInitialSupply(mint, associatedTokenAccount, tokenConfig.totalSupply);
      
      // Add initial liquidity to Heaven DEX
      const liquidityResult = await this.addInitialLiquidity(mint, tokenConfig);
      
      console.log('✅ Token launched successfully!');
      
      return {
        mint: mint.publicKey.toString(),
        associatedTokenAccount: associatedTokenAccount.toString(),
        tx: liquidityResult.tx,
        tokenInfo: {
          name: tokenConfig.name,
          symbol: tokenConfig.symbol,
          decimals: tokenConfig.decimals,
          totalSupply: tokenConfig.totalSupply
        }
      };
      
    } catch (error) {
      console.error('❌ Token launch failed:', error);
      throw error;
    }
  }

  /**
   * Create a new token mint
   */
  async createTokenMint(tokenConfig) {
    const mint = Keypair.generate();
    
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        space: 82,
        lamports: await this.connection.getMinimumBalanceForRentExemption(82),
        programId: TOKEN_PROGRAM_ID
      }),
      Token.createInitializeMintInstruction(
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        tokenConfig.decimals,
        this.wallet.publicKey,
        this.wallet.publicKey
      )
    );

    const signature = await this.connection.sendTransaction(transaction, [this.wallet, mint]);
    await this.connection.confirmTransaction(signature);
    
    console.log('🎯 Token mint created:', mint.publicKey.toString());
    return mint;
  }

  /**
   * Create associated token account
   */
  async createAssociatedTokenAccount(mint) {
    const associatedTokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      this.wallet.publicKey
    );

    const transaction = new Transaction().add(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        associatedTokenAccount,
        this.wallet.publicKey,
        this.wallet.publicKey
      )
    );

    const signature = await this.connection.sendTransaction(transaction, [this.wallet]);
    await this.connection.confirmTransaction(signature);
    
    console.log('🏦 Associated token account created:', associatedTokenAccount.toString());
    return associatedTokenAccount;
  }

  /**
   * Mint initial token supply
   */
  async mintInitialSupply(mint, associatedTokenAccount, totalSupply) {
    const transaction = new Transaction().add(
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        associatedTokenAccount,
        this.wallet.publicKey,
        [],
        totalSupply * Math.pow(10, mint.publicKey.decimals)
      )
    );

    const signature = await this.connection.sendTransaction(transaction, [this.wallet]);
    await this.connection.confirmTransaction(signature);
    
    console.log('💰 Initial supply minted:', totalSupply);
  }

  /**
   * Add initial liquidity to Heaven DEX
   */
  async addInitialLiquidity(mint, tokenConfig) {
    // This is a simplified version - in reality, you'd integrate with Heaven DEX's specific API
    console.log('💧 Adding initial liquidity to Heaven DEX...');
    
    // Simulate liquidity addition
    const liquidityTx = {
      tx: 'simulated_liquidity_transaction_signature',
      amount: tokenConfig.initialLiquidity,
      price: tokenConfig.initialPrice
    };
    
    return liquidityTx;
  }

  /**
   * Get token balance
   */
  async getTokenBalance(mintAddress, walletAddress) {
    try {
      const mint = new PublicKey(mintAddress);
      const wallet = new PublicKey(walletAddress);
      
      const associatedTokenAccount = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        wallet
      );
      
      const balance = await this.connection.getTokenAccountBalance(associatedTokenAccount);
      return balance.value.uiAmount;
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  /**
   * Get wallet SOL balance
   */
  async getSolBalance(walletAddress) {
    try {
      const wallet = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(wallet);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting SOL balance:', error);
      return 0;
    }
  }
}

module.exports = { HeavenDEXBot };
