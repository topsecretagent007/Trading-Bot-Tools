import { Logger } from 'pino';
import dotenv from 'dotenv';
import fs from 'fs';
import axios from 'axios';
import { BACKEND_URL } from '../constants';

dotenv.config();

export const retrieveEnvVariable = (variableName: string) => {
  const variable = process.env[variableName] || '';
  if (!variable) {
    console.log(`${variableName} is not set`);
    process.exit(1);
  }
  return variable;
};


// Define the type for the JSON file content
export interface Data {
  privateKey: string;
  pubkey: string;
}

// Function to edit JSON file content
export function editJson(newData: Partial<Data>, filename: string = "data.json"): void {
  if (!newData.pubkey) {
    console.log("Pubkey is not prvided as an argument")
    return
  }
  const wallets = readJson(filename);
  const index = wallets.findIndex(wallet => wallet.pubkey === newData.pubkey);
  if (index !== -1) {
    wallets[index] = { ...wallets[index], ...newData };
    writeJson(wallets, filename);
  } else {
    console.error(`Pubkey ${newData.pubkey} does not exist.`);
  }
}

