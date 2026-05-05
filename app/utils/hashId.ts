import Sqids from 'sqids';

/**
 * Encode/decode integer IDs for use in browser URLs.
 * This is purely cosmetic obfuscation — NOT security.
 * Backend APIs still use raw integer IDs.
 */
const sqids = new Sqids({
    alphabet: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    minLength: 6,
});

/** Encode an integer ID → short hash string for URL display */
export function encodeId(id: number): string {
    return sqids.encode([id]);
}

/** Decode a hash string → integer ID for API calls */
export function decodeId(hash: string): number {
    const result = sqids.decode(hash);
    return result.length > 0 ? result[0] : NaN;
}
