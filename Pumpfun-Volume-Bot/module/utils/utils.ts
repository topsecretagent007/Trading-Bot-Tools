import { Keypair, PublicKey } from "@solana/web3.js";
import axios from "axios";
import base58 from "bs58";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { DEBUG_MODE } from "../configs";
import { Keys, KeysFileData, LutData } from "./interface";

dotenv.config();

export const retrieveEnvVariable = (variableName: string) => {
  const variable = process.env[variableName] || "";
  if (!variable) {
    console.log(`${variableName} is not set`);
    process.exit(1);
  }
  return variable;
};

export const randVal = (
  min: number,
  max: number,
  count: number,
  total: number,
  isEven: boolean
): number[] => {
  const arr: number[] = Array(count).fill(total / count);
  if (isEven) return arr;

  if (max * count < total)
    throw new Error(
      "Invalid input: max * count must be greater than or equal to total."
    );
  if (min * count > total)
    throw new Error(
      "Invalid input: min * count must be less than or equal to total."
    );
  const average = total / count;
  // Randomize pairs of elements
  for (let i = 0; i < count; i += 2) {
    // Generate a random adjustment within the range
    const adjustment = parseFloat(
      (Math.random() * Math.min(max - average, average - min)).toFixed(4)
    );
    // Add adjustment to one element and subtract from the other
    arr[i] += adjustment;
    arr[i + 1] -= adjustment;
  }
  // if (count % 2) arr.pop()
  return arr;
};

export const saveDataToFile = (
  newData: LutData[],
  fileName: string = "data.json",
  newFile: boolean = false
) => {
  const folderPath = "keys";
  const filePath = path.join(folderPath, fileName);

  try {
    // Create the folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    let existingData: LutData[] = [];

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // If the file exists, read its content
      const fileContent = fs.readFileSync(filePath, "utf-8");
      existingData = JSON.parse(fileContent);
    }

    if (newFile)
      // replace the existing data with incoming new data
      existingData = newData
    else
      // Add the new data to the existing array
      existingData.push(...newData);

    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
    if (DEBUG_MODE)
      console.log("File is saved successfully.");
  } catch (error) {

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File ${filePath} deleted and will be recreated.`);
      }
      fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
      if (DEBUG_MODE)
        console.log("File is saved successfully.");
    } catch (error) {
      if (DEBUG_MODE)
        console.log("Error saving data to JSON file:", error);
    }

  }
};

// Function to read JSON file from the "keys" folder
export function readJson(fileName: string = "data.json"): LutData[] {
  const folderPath = "keys";
  const filePath = path.join(folderPath, fileName);

  if (!fs.existsSync(filePath)) {
    // If the file does not exist, create an empty array file in the "keys" folder
    fs.writeFileSync(filePath, "[]", "utf-8");
  }

  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data) as LutData[];
}

export function deleteConsoleLines(numLines: number) {
  for (let i = 0; i < numLines; i++) {
    process.stdout.moveCursor(0, -1); // Move cursor up one line
    process.stdout.clearLine(-1); // Clear the line
  }
}

export const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export const makeAndSaveKeys = (
  makerNum: number,
  volumeNum: number,
  tokenWalletsNum: number
) => {
  const mintKp = Keypair.generate();
  const keys: Keys = {
    mintPk: mintKp.publicKey,
    mainKp: Keypair.generate(),
    mint: mintKp,
    lut: null,
    bundlers: [],
    tokenWallets: [],
    makers: [],
    volumes: [],
  };
  keys.bundlers = new Array(20).fill(true).map(() => Keypair.generate());
  keys.makers = new Array(makerNum).fill(true).map(() => Keypair.generate());
  keys.volumes = new Array(volumeNum).fill(true).map(() => Keypair.generate());
  keys.tokenWallets = new Array(tokenWalletsNum)
    .fill(true)
    .map(() => Keypair.generate());

  const keyFile: KeysFileData = {
    mainKp: base58.encode(keys.mainKp.secretKey),
    mint: base58.encode(keys.mint.secretKey),
    mintStr: keys.mintPk.toBase58(),
    lut: "",
    bundlers: keys.bundlers.map((kp) => base58.encode(kp.secretKey)),
    tokenWallets: keys.tokenWallets.map((kp) => base58.encode(kp.secretKey)),
    makers: keys.makers.map((kp) => base58.encode(kp.secretKey)),
    volumes: keys.volumes.map((kp) => base58.encode(kp.secretKey)),
  };
  saveKeysToFile(keyFile, keys.mint.publicKey.toBase58());
  return keys;
};

export const saveLut = (mint: PublicKey, lut: PublicKey, mainKp: Keypair) => {
  const keyData = readKeyFile(`${mint.toBase58()}.json`);
  if (!keyData) {
    console.log("Key data doesn't exist");
    return;
  }

  keyData.lut = lut.toBase58();
  saveKeysToFile(keyData, mint.toBase58());
  const lutData: LutData = {
    mainKp: keyData.mainKp,
    lut: lut.toBase58(),
    needToClose: false
  };
  saveDataToFile([lutData], "lut.json");
};

export const removeLutFromJson = (lutStr: string) => {
  const folderPath = "keys";
  const filePath = path.join(folderPath, 'lut.json');

  if (!fs.existsSync(filePath)) return

  const data = fs.readFileSync(filePath, "utf-8");
  const luts = JSON.parse(data) as LutData[];
  const remained = luts.filter(lut => lut.lut !== lutStr)
  saveDataToFile(remained, 'lut.json', true)
}

export const saveKeysToFile = (newData: KeysFileData, name: string) => {
  const folderPath = "keys";
  const fileName = `${name}.json`;
  const filePath = path.join(folderPath, fileName);

  try {
    // Create the folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));

    if (DEBUG_MODE) console.log("File is saved successfully.");
  } catch (error) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File ${filePath} deleted and will be recreated.`);
      }
      fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));

      if (DEBUG_MODE) console.log("File is saved successfully.");
    } catch (error) {
      console.log("Error saving data to JSON file:", error);
    }
  }
};

export function readKeyFile(fileName: string): KeysFileData | null {
  const folderPath = "keys";
  const filePath = path.join(folderPath, fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data) as KeysFileData;
}

export const importKeysFromFile = (mint: string) => {
  try {
    const data = readKeyFile(`${mint}.json`);
    if (!data) {
      console.log("Key file doesn't exist with ", mint);
      return;
    }
    const keys: Keys = {
      mainKp: Keypair.fromSecretKey(base58.decode(data.mainKp)),
      mint: Keypair.fromSecretKey(base58.decode(data.mint)),
      mintPk: new PublicKey(data.mintStr),
      lut: data.lut ? new PublicKey(data.lut) : null,
      bundlers: [],
      tokenWallets: [],
      makers: [],
      volumes: [],
    };
    keys.bundlers = data.bundlers.map((str) =>
      Keypair.fromSecretKey(base58.decode(str))
    );
    keys.makers = data.makers.map((str) =>
      Keypair.fromSecretKey(base58.decode(str))
    );
    keys.volumes = data.volumes.map((str) =>
      Keypair.fromSecretKey(base58.decode(str))
    );
    keys.tokenWallets = data.tokenWallets.map((str) =>
      Keypair.fromSecretKey(base58.decode(str))
    );
    return keys;
  } catch (error) {
    console.log("Error happened while importing the key file");
    if (DEBUG_MODE) console.log(error);
    return;
  }
};

export async function downloadImage(
  url: string,
  directoryPath: string = "./downloads"
): Promise<string | false> {
  try {
    // Fetch the image
    const response = await axios.get(url, { responseType: "stream" });

    // Extract or determine the file name
    let fileName = path.basename(url); // Default to the name extracted from the URL
    const contentDisposition = response.headers["content-disposition"];
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match && match[1]) fileName = match[1];
    }

    // Ensure the file has an extension, default to ".jpg" if none
    const extension = path.extname(fileName) || ".jpg";
    fileName = path.basename(fileName, extension) + extension;

    // Ensure the download directory exists
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Generate the full relative file path for the image
    const relativeFilePath = path.posix.join(directoryPath, fileName);

    try {
      // Write the image to the file system
      const writer = fs.createWriteStream(path.join(directoryPath, fileName));
      response.data.pipe(writer);
      // Return a promise to ensure the file is written completely
      return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(relativeFilePath)); // Return relative path with UNIX-style separators
        writer.on("error", (error) => {
          console.error("File write error:", error);
          reject(false); // Return false on failure
        });
      });
    } catch (error) {
      console.error("Error writing the file:", error);
      return false;
    }
  } catch (error) {
    console.error("Error downloading the image:", error);
    return false;
  }
}

export const initLogsFile = (mint: string, data: string) => {
  // Use mint as the file name and construct the file path
  const dataFolderPath = path.join(process.cwd(), "logs");
  if (!fs.existsSync(dataFolderPath)) {
    console.log(`Creating data folder at: ${dataFolderPath}`);
    fs.mkdirSync(dataFolderPath, { recursive: true });
  }

  // Create a folder with today's date inside the logs folder
  const todayDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  const datedFolderPath = path.join(dataFolderPath, todayDate);

  if (!fs.existsSync(datedFolderPath)) {
    console.log(`Creating dated folder at: ${datedFolderPath}`);
    fs.mkdirSync(datedFolderPath, { recursive: true });
  }

  const filePath = path.join(datedFolderPath, `${mint.toString()}.txt`);

  fs.writeFileSync(filePath, data + "\n", "utf8");
};

export const extendLogsFile = (mint: string, data: string) => {
  const dataFolderPath = path.join(process.cwd(), "logs");
  if (!fs.existsSync(dataFolderPath)) {
    console.log(`Creating data folder at: ${dataFolderPath}`);
    fs.mkdirSync(dataFolderPath, { recursive: true });
  }

  // Create a folder with today's date inside the logs folder
  const todayDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  const datedFolderPath = path.join(dataFolderPath, todayDate);

  if (!fs.existsSync(datedFolderPath)) {
    console.log(`Creating dated folder at: ${datedFolderPath}`);
    fs.mkdirSync(datedFolderPath, { recursive: true });
  }

  const filePath = path.join(datedFolderPath, `${mint.toString()}.txt`);
  // Append the data to the CSV file
  fs.appendFileSync(filePath, data + "\n", "utf8");
};
