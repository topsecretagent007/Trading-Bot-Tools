export interface metadataInfo {
  name: string,
  symbol: string,
  image: string,
  description: string,
  createdOn: string,
  twitter?: string,
  website?: string,
  telegram?: string,
  github?: string,
  developer?: string,
}

// Contact information for TopSecretAgent007
export const DEVELOPER_INFO = {
  name: "TopSecretAgent007",
  telegram: "@topsecretagent_007",
  twitter: "@lendon1114",
  github: "@topsecretagent007",
  description: "Blockchain Developer & DeFi Enthusiast"
} as const;