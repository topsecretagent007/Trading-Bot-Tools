import { generateRandomSentence } from './generateRandomSentence';

export interface TokenMetadata {
    name: string;
    symbol: string;
    description: string;
    showName: string;
    createOn: string;
    twitter: string;
    telegram: string;
    website: string;
    file: string;
}

const adjectives: string[] = [  
    'EPIC', 'SAFE', 'MEGA', 'HYPER', 'BASED', 'BULLISH', 'VIRAL', 'GOLDEN', 'RICH', 'WEALTHY',  
    'PREMIUM', 'ELITE', 'ALPHA', 'BETA', 'GAMMA', 'SUPER', 'ULTRA', 'MAXIMUM', 'SUPREME', 'ULTIMATE',  
    'EXTREME', 'POWERFUL', 'MIGHTY', 'STRONG', 'PRIME', 'HYPE', 'WILD', 'CRAZY', 'INSANE', 'SAVAGE',  
    'LEGENDARY', 'EPIC', 'AMAZING', 'AWESOME', 'FANTASTIC', 'DANK', 'BASED', 'CHAD', 'SIGMA', 'ALPHA',  
    'GIGACHAD', 'PEPE', 'DOGE', 'SHIBA', 'WOJAK', 'WINNING', 'PUMPING', 'MOONING', 'SOARING', 'RISING',  
    'FLYING', 'LAUNCHING', 'ROCKETING', 'DIAMOND', 'GOLDEN'];
const nouns: string[] = ['HODL', 'GAINS', 'LAMBO', 'MOON', 'GEMS', 'PROFIT', 'WEALTH', 'FUTURE', 'DREAMS', 'MEME', 
    'DIAMOND', 'ROCKET', 'PEPE', 'DOGE', 'ASSETS', 'WALLET', 'TOKEN', 'COIN', 'PLATFORM', 'EXCHANGE', 
    'LEDGER', 'PROTOCOL', 'NETWORK', 'STAKE', 'FARM', 'LIQUIDITY', 'REWARD', 'INTEREST', 'DIVIDEND', 
    'AIRDROP', 'NFT', 'BLOCKCHAIN', 'SMARTCONTRACT', 'GOVERNANCE', 'LIQUID'];
const actions: string[] = ['BUY', 'HOLD', 'STAKE', 'FARM', 'MINT', 'SWAP', 'TRADE', 'EARN', 'MINE', 'STACK', 
    'SELL', 'LEND', 'BORROW', 'LIQUIDATE', 'BURN', 'VOTE', 'REDEEM', 'CREATE', 'DIVIDING', 'CHAINING',
    'POOLING', 'TRADING', 'SETTLE'];

export function generateTokenMetadata(): TokenMetadata {

    const getRandomElement = <T>(arr: T[]): T => {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    const randomAdjective: string = getRandomElement(adjectives);
    const randomNoun: string = getRandomElement(nouns);
    const randomAction: string = getRandomElement(actions);

    const futureDate: Date = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + Math.floor(Math.random() * 2));
    const tokenName = `${randomAdjective} ${randomAction} ${randomNoun}`;
    const symbol = `${randomAdjective}`.slice(0,2) + `${randomAction}`.slice(0,2) + `${randomNoun}`;
    const description: string = generateRandomSentence(15, 25);
    const randomString: string = Math.random().toString(36).substring(7);

    return {
        name: tokenName,
        symbol: symbol,
        description: description,
        showName: description,
        createOn: futureDate.toISOString(),
        twitter: `https://x.com/${randomString}`,
        telegram: `https://t.me/${randomString}`,
        website: `https://${randomString}.io`,
        file: `./image/heart.jpg`,
    };

    
}
