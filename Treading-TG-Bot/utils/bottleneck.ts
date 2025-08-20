import TelegramBot from 'node-telegram-bot-api';
import Bottleneck from "bottleneck";


// Create a bottleneck instance enforcing a limit (e.g., 30 calls per second globally)
export const bottleneck = new Bottleneck({
    maxConcurrent: 1, // Ensures requests are handled one at a time
    minTime: 35 // Allows 1 request every 35ms (~30 requests per second)
});
