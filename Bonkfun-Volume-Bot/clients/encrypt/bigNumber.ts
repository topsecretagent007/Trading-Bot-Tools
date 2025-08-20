import BigNumber from 'bignumber.js';

export function bigNumberToLEBuffer(value: BigNumber, bytes = 8): Buffer {
    const hex = value.toString(16).padStart(bytes * 2, '0');
    const buffer = Buffer.from(hex, 'hex').reverse(); // convert to LE first

    // Ensure the buffer is exactly `bytes` long by padding with 0x00
    if (buffer.length < bytes) {
        const padded = Buffer.alloc(bytes); // filled with 0x00
        buffer.copy(padded);
        return padded;
    }

    return buffer.slice(0, bytes); // trim if somehow longer (safety)
}