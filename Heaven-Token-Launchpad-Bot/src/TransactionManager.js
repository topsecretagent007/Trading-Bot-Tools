const { Connection, PublicKey, VersionedTransaction, TransactionMessage, AddressLookupTableAccount } = require('@solana/web3.js');

class TransactionManager {
  constructor(rpcUrl) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Fetch a transaction from the blockchain
   * @param {string} signature - Transaction signature
   * @returns {Object} - Transaction data
   */
  async fetchTransaction(signature) {
    try {
      console.log('📡 Fetching transaction:', signature);
      
      const transaction = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      console.log('✅ Transaction fetched successfully');
      return transaction;
      
    } catch (error) {
      console.error('❌ Failed to fetch transaction:', error);
      throw error;
    }
  }

  /**
   * Decompile a versioned transaction
   * @param {Object} transaction - Transaction object
   * @returns {Object} - Decompiled transaction message
   */
  async decompileTransaction(transaction) {
    try {
      console.log('🔍 Decompiling transaction...');
      
      if (!transaction.transaction) {
        throw new Error('Invalid transaction format');
      }
      
      const versionedTx = VersionedTransaction.deserialize(
        Buffer.from(transaction.transaction, 'base64')
      );
      
      // Resolve Address Lookup Tables
      const lookupTableAccounts = await this.resolveLookupTables(versionedTx);
      
      // Decompile the transaction message
      const decompiledMessage = TransactionMessage.decompile(
        versionedTx.message,
        { addressLookupTableAccounts: lookupTableAccounts }
      );
      
      console.log('✅ Transaction decompiled successfully');
      return decompiledMessage;
      
    } catch (error) {
      console.error('❌ Failed to decompile transaction:', error);
      throw error;
    }
  }

  /**
   * Rebuild a transaction with updated parameters
   * @param {Object} decompiledMessage - Decompiled transaction message
   * @returns {Object} - Rebuilt transaction
   */
  async rebuildTransaction(decompiledMessage) {
    try {
      console.log('🔧 Rebuilding transaction...');
      
      // Get latest blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      
      // Compile to V0 message
      const compiledV0 = new TransactionMessage({
        payerKey: decompiledMessage.payerKey,
        recentBlockhash: blockhash,
        instructions: decompiledMessage.instructions
      }).compileToV0Message();
      
      // Create new versioned transaction
      const vTx = new VersionedTransaction(compiledV0);
      
      console.log('✅ Transaction rebuilt successfully');
      return vTx;
      
    } catch (error) {
      console.error('❌ Failed to rebuild transaction:', error);
      throw error;
    }
  }

  /**
   * Resolve Address Lookup Tables from a transaction
   * @param {VersionedTransaction} versionedTx - Versioned transaction
   * @returns {Array} - Array of lookup table accounts
   */
  async resolveLookupTables(versionedTx) {
    try {
      if (!versionedTx.message.addressTableLookups || 
          versionedTx.message.addressTableLookups.length === 0) {
        console.log('ℹ️ No address lookup tables found');
        return [];
      }
      
      console.log(`🔍 Resolving ${versionedTx.message.addressTableLookups.length} lookup tables...`);
      
      const lookupTableAccounts = await Promise.all(
        versionedTx.message.addressTableLookups.map(async (lookup) => {
          const accountInfo = await this.connection.getAccountInfo(lookup.accountKey);
          
          if (!accountInfo) {
            throw new Error(`Lookup table account not found: ${lookup.accountKey.toString()}`);
          }
          
          return new AddressLookupTableAccount({
            key: lookup.accountKey,
            state: AddressLookupTableAccount.deserialize(accountInfo.data)
          });
        })
      );
      
      console.log('✅ Lookup tables resolved successfully');
      return lookupTableAccounts;
      
    } catch (error) {
      console.error('❌ Failed to resolve lookup tables:', error);
      throw error;
    }
  }

  /**
   * Analyze transaction instructions
   * @param {Object} decompiledMessage - Decompiled transaction message
   * @returns {Object} - Analysis results
   */
  analyzeTransaction(decompiledMessage) {
    try {
      const analysis = {
        totalInstructions: decompiledMessage.instructions.length,
        programIds: [],
        accounts: [],
        estimatedFee: 0
      };
      
      // Extract unique program IDs
      decompiledMessage.instructions.forEach(instruction => {
        if (!analysis.programIds.includes(instruction.programId.toString())) {
          analysis.programIds.push(instruction.programId.toString());
        }
        
        // Extract account keys
        instruction.keys.forEach(key => {
          if (!analysis.accounts.includes(key.pubkey.toString())) {
            analysis.accounts.push(key.pubkey.toString());
          }
        });
      });
      
      // Estimate fee (simplified)
      analysis.estimatedFee = analysis.totalInstructions * 5000; // 5000 lamports per instruction
      
      return analysis;
      
    } catch (error) {
      console.error('Error analyzing transaction:', error);
      return null;
    }
  }

  /**
   * Get transaction status
   * @param {string} signature - Transaction signature
   * @returns {string} - Transaction status
   */
  async getTransactionStatus(signature) {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return status?.value?.confirmationStatus || 'unknown';
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return 'error';
    }
  }

  /**
   * Wait for transaction confirmation
   * @param {string} signature - Transaction signature
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {boolean} - Confirmation status
   */
  async waitForConfirmation(signature, maxRetries = 30) {
    try {
      console.log('⏳ Waiting for transaction confirmation...');
      
      let retries = 0;
      while (retries < maxRetries) {
        const status = await this.getTransactionStatus(signature);
        
        if (status === 'confirmed' || status === 'finalized') {
          console.log('✅ Transaction confirmed');
          return true;
        }
        
        if (status === 'failed') {
          console.log('❌ Transaction failed');
          return false;
        }
        
        await this.sleep(1000); // Wait 1 second
        retries++;
      }
      
      console.log('⏰ Transaction confirmation timeout');
      return false;
      
    } catch (error) {
      console.error('Error waiting for confirmation:', error);
      return false;
    }
  }

  /**
   * Utility function to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { TransactionManager };
