import fs from 'fs';
import path from 'path';

export interface WalletData {
  privateKey: string;
  amount: number;
  group: string;
}

export interface MintWalletData {
  privateKey: string;
}

export interface TaskData {
  mintWallet: string | null;
  wallets: {
    group1: WalletData[];
    group2: WalletData[];
    group3: WalletData[];
  };
}

/**
 * Parse unified task CSV file and return all wallet data
 * Expected CSV format: type,privateKey,amount,group
 * type can be: "mint" or "wallet"
 * group can be: "1", "2", "3" (for wallets only)
 */
export function parseTaskCSV(fileName: string = "task.csv"): TaskData {
  const folderPath = './';
  const filePath = path.join(folderPath, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`CSV file ${filePath} not found. Creating empty file.`);
    fs.writeFileSync(filePath, 'type,privateKey,amount,group\n', 'utf-8');
    return {
      mintWallet: null,
      wallets: {
        group1: [],
        group2: [],
        group3: []
      }
    };
  }

  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    let mintWallet: string | null = null;
    const wallets: {
      group1: WalletData[];
      group2: WalletData[];
      group3: WalletData[];
    } = {
      group1: [],
      group2: [],
      group3: []
    };
    
    for (const line of dataLines) {
      if (line.trim() === '') continue;
      
      const [type, privateKey, amountStr, group] = line.split(',').map(s => s.trim());
      
      if (!type || !privateKey) {
        console.warn(`Skipping invalid line: ${line}`);
        continue;
      }
      
      if (type.toLowerCase() === 'mint') {
        mintWallet = privateKey;
        console.log('Loaded mint wallet from task.csv');
      } else if (type.toLowerCase() === 'wallet') {
        if (!amountStr || !group) {
          console.warn(`Skipping invalid wallet line: ${line}`);
          continue;
        }
        
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) {
          console.warn(`Invalid amount in line: ${line}`);
          continue;
        }
        
        const walletData: WalletData = {
          privateKey,
          amount,
          group
        };
        
        switch (group) {
          case '1':
            wallets.group1.push(walletData);
            break;
          case '2':
            wallets.group2.push(walletData);
            break;
          case '3':
            wallets.group3.push(walletData);
            break;
          default:
            console.warn(`Invalid group ${group} in line: ${line}`);
            break;
        }
      } else {
        console.warn(`Invalid type ${type} in line: ${line}`);
      }
    }
    
    console.log(`Loaded from task.csv: mint wallet and ${wallets.group1.length + wallets.group2.length + wallets.group3.length} wallets (group1: ${wallets.group1.length}, group2: ${wallets.group2.length}, group3: ${wallets.group3.length})`);
    
    return {
      mintWallet,
      wallets
    };
    
  } catch (error) {
    console.error(`Error reading CSV file ${filePath}:`, error);
    return {
      mintWallet: null,
      wallets: {
        group1: [],
        group2: [],
        group3: []
      }
    };
  }
}

/**
 * Parse CSV file and return wallet data (legacy function for backward compatibility)
 * Expected CSV format: privateKey,amount
 */
export function parseWalletsCSV(fileName: string = "wallets.csv"): WalletData[] {
  const folderPath = 'keys';
  const filePath = path.join(folderPath, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`CSV file ${filePath} not found. Creating empty file.`);
    fs.writeFileSync(filePath, 'privateKey,amount\n', 'utf-8');
    return [];
  }

  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    const wallets: WalletData[] = [];
    
    for (const line of dataLines) {
      if (line.trim() === '') continue;
      
      const [privateKey, amountStr] = line.split(',').map(s => s.trim());
      
      if (!privateKey || !amountStr) {
        console.warn(`Skipping invalid line: ${line}`);
        continue;
      }
      
      const amount = parseFloat(amountStr);
      if (isNaN(amount)) {
        console.warn(`Invalid amount in line: ${line}`);
        continue;
      }
      
      wallets.push({
        privateKey,
        amount,
        group: '1' // Default group for legacy compatibility
      });
    }
    
    console.log(`Loaded ${wallets.length} wallets from ${fileName}`);
    return wallets;
    
  } catch (error) {
    console.error(`Error reading CSV file ${filePath}:`, error);
    return [];
  }
}

/**
 * Parse CSV file and return mint wallet data (legacy function for backward compatibility)
 * Expected CSV format: privateKey
 */
export function parseMintWalletCSV(fileName: string = "mintWallet.csv"): string | null {
  const folderPath = 'keys';
  const filePath = path.join(folderPath, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`CSV file ${filePath} not found. Creating empty file.`);
    fs.writeFileSync(filePath, 'privateKey\n', 'utf-8');
    return null;
  }

  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    if (dataLines.length === 0) {
      console.warn(`No mint wallet data found in ${fileName}`);
      return null;
    }
    
    const privateKey = dataLines[0].trim();
    if (!privateKey) {
      console.warn(`Empty private key in ${fileName}`);
      return null;
    }
    
    console.log(`Loaded mint wallet from ${fileName}`);
    return privateKey;
    
  } catch (error) {
    console.error(`Error reading CSV file ${filePath}:`, error);
    return null;
  }
}

/**
 * Convert wallet data to the format expected by the main function
 */
export function convertWalletsToObject(wallets: WalletData[]): Record<string, number> {
  const walletObject: Record<string, number> = {};
  
  for (const wallet of wallets) {
    walletObject[wallet.privateKey] = wallet.amount;
  }
  
  return walletObject;
} 
