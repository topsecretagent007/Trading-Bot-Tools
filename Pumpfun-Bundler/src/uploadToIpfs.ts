
import fs from 'fs';
import { FleekSdk, PersonalAccessTokenService } from '@fleekxyz/sdk';
import dotenv from 'dotenv';
import metadata from './metadata';
dotenv.config();

const pat = process.env.PAT || '';
const project_id = process.env.PROJECT_ID || '';
const imageName = "./upload/bolt.jpg";
const metadataName = "./upload/metadata.json";

const patService = new PersonalAccessTokenService({
  personalAccessToken: pat,
  projectId: project_id,
})

const fleekSdk = new FleekSdk({ accessTokenService: patService })

async function uploadFileToIPFS(filename: string, content: Buffer) {
  const result = await fleekSdk.ipfs().add({
    path: filename,
    content: content
  });
  return result;
}

export const getUploadedMetadataURI = async (): Promise<string> => {
  const fileContent = fs.readFileSync(imageName);

}