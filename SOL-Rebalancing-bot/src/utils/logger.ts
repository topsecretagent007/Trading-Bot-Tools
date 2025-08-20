import pino from "pino";

const transport = pino.transport({
    target: 'pino-pretty',
});

export const logger = pino(
    
);
