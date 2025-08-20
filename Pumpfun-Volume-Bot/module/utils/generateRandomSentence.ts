interface WordLists {
    subjects: string[];
    verbs: string[];
    adjectives: string[];
    objects: string[];
    prepositions: string[];
    conjunctions: string[];
    adverbs: string[];
}

const words: WordLists = {
    subjects: ['the market', 'crypto', 'bitcoin', 'blockchain', 'web3', 'defi', 'NFTs', 'traders', 'holders', 'investors'],
    verbs: ['moves', 'grows', 'builds', 'creates', 'develops', 'transforms', 'revolutionizes', 'accelerates', 'drives', 'enables'],
    adjectives: ['innovative', 'decentralized', 'secure', 'scalable', 'revolutionary', 'dynamic', 'powerful', 'sustainable', 'efficient', 'advanced'],
    objects: ['solutions', 'opportunities', 'technologies', 'systems', 'platforms', 'networks', 'ecosystems', 'protocols', 'applications', 'frameworks'],
    prepositions: ['in', 'through', 'with', 'across', 'beyond', 'within', 'around', 'towards', 'during', 'throughout'],
    conjunctions: ['and', 'while', 'as', 'because', 'although', 'however', 'moreover', 'furthermore', 'therefore', 'meanwhile'],
    adverbs: ['quickly', 'efficiently', 'seamlessly', 'continuously', 'rapidly', 'effectively', 'consistently', 'reliably', 'securely', 'progressively']
};

function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

export function generateRandomSentence(minWords: number = 10, maxWords: number = 25): string {
    const targetLength = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    let sentence: string[] = [];
    
    while (sentence.length < targetLength) {
        const patterns = [
            // Pattern: Subject + Verb + Object
            () => [getRandomElement(words.subjects), getRandomElement(words.verbs), getRandomElement(words.adjectives), getRandomElement(words.objects)],
            // Pattern: Subject + Verb + Preposition + Object
            () => [getRandomElement(words.subjects), getRandomElement(words.verbs), getRandomElement(words.prepositions), getRandomElement(words.objects)],
            // Pattern: Adverb + Subject + Verb + Object
            () => [getRandomElement(words.adverbs), getRandomElement(words.subjects), getRandomElement(words.verbs), getRandomElement(words.objects)],
            // Pattern: Conjunction + Subject + Verb
            () => [getRandomElement(words.conjunctions), getRandomElement(words.subjects), getRandomElement(words.verbs)]
        ];

        const newPhrase = getRandomElement(patterns)();
        sentence = [...sentence, ...newPhrase];
    }

    sentence = sentence.slice(0, targetLength);
    sentence[0] = sentence[0].charAt(0).toUpperCase() + sentence[0].slice(1);

    return sentence.join(' ') + '.';
}
