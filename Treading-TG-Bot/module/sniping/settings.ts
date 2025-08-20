import fs from 'fs';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';


const SETTINGS_FILE = '.settings.json';

// Default settings object
const defaultSettings = {
  secretkey: bs58.encode(Keypair.generate().secretKey),
  snipeAmt: .1,
  slippage: 25,
  buyAttempts: 2,
  rpcUrl: "",
  channels: [],
  //usernames: [],
  //tgsession: "",
  apiId: "",
  apiHash: "",
  // Add more default settings as needed
};

// Function to load settings from file or use defaults
export function loadSettingsFile() {
  try {
    const settingsData = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(settingsData);
    // Merge default settings with loaded settings (overwrite defaults if already present)
    return { ...defaultSettings, ...settings };
  } catch (err) {
    // @ts-ignore
    console.error(`Error loading settings: ${err.message}`);
    // Return default settings if file doesn't exist or JSON parsing fails
    saveSettings(defaultSettings)
    return defaultSettings;
  }
}

// Function to save settings to file
export function saveSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('Settings saved successfully.');
  } catch (err) {
    // @ts-ignore
    console.error(`Error saving settings: ${err.message}`);
  }
}

// Function to print current settings to CLI
export function printSettings() {
  const settings = loadSettingsFile();
  console.log('\nCurrent Settings:');
  Object.entries(settings).forEach(([key, value]) => {
    if(key=='secretkey') {
      const pubkey = Keypair.fromSecretKey(bs58.decode(value as string))
      console.log(`Public key: ${pubkey.publicKey}`);
    } else {
      console.log(`${key}: ${value}`);
    }
  });
}
