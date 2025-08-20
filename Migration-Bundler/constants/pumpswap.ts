import { PublicKey } from "@solana/web3.js"

const PUMPSWAP_PROGRAM_ADDR = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");

const PUMPSWAP_DEVNET_FEE_ADDR =
    [
        new PublicKey("12e2F4DKkD3Lff6WPYsU7Xd76SHPEyN9T8XSsTJNF8oT"),
        new PublicKey("2Ej38XSkmpvXzoUg5ZLma7Y9rCiZVgxzTdvE3Kph5juM"),
        new PublicKey("3PAxmkxnM2vHno9amWQCsaaFjYnPGcD87HZGx1ChVjPj"),
        new PublicKey("4QZqaBNm2F7viBDhhs8AQ5wC9FshgLJEiLLFGoxZZrTn"),
        new PublicKey("9xvDPD6G7NRCEu7W2M9vCLeo8we23Ww7pzQEhXcuJAmA"),
        new PublicKey("CdkG7sp1LT9YLsDaTWREaQcX6W4gZySk3o1eSjoL2uTh"),
        new PublicKey("Freijj9xKLefjrb5fHgT6KMbYG1XBP2mA83tqeXYUMYM"),
        new PublicKey("Hxzab4UjjVH2KjsdAqzdxGdYUpNN5FKhpu7iikB869uH")
    ]

const PUMPSWAP_MAINNET_FEE_ADDR = [
    new PublicKey("62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV"),
    new PublicKey("7VtfL8fvgNfhz17qKRMjzQEXgbdpnHHHQRh54R9jP2RJ"),
    new PublicKey("7hTckgnGnLQR6sdH7YkqFTAA7VwTfYFaZ6EhEsU3saCX"),
    new PublicKey("9rPYyANsfQZw3DnDmKE3YCQF5E8oD89UXoHn9JFEhJUz"),
    new PublicKey("AVmoTthdrX6tKt4nDjco2D775W2YK3sDhxPcMmzUAmTY"),
    new PublicKey("FWsW1xNtWscwNmKv6wVsU1iTzRN6wmmk3MjxRP5tT7hz"),
    new PublicKey("G5UZAVbAf46s7cKWoyKu8kYTip9DGTpbLZ2qa9Aq69dP"),
    new PublicKey("JCRGumoE9Qi5BBgULTgdgTLjSgkCMSbF62ZZfGs84JeU"),
]

const PUMPSWAP_GLOBAL_CONFIG = "global_config";
const PUMPSWAP_EVENT_AUTH = "__event_authority";
const PUMPSWAP_POOL = "pool";

export {
    PUMPSWAP_DEVNET_FEE_ADDR,
    PUMPSWAP_MAINNET_FEE_ADDR,
    PUMPSWAP_PROGRAM_ADDR,
    PUMPSWAP_GLOBAL_CONFIG,
    PUMPSWAP_EVENT_AUTH,
    PUMPSWAP_POOL
}
