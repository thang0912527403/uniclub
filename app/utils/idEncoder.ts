/**
 * Simple reversible ID encoding to hide numeric IDs from URLs.
 * Uses XOR with a constant mask + base36 conversion.
 *
 * Example:
 *   encodeId(5)   → "q5a1hg"
 *   decodeId("q5a1hg") → 5
 */

const MASK = 0x5A3C96E1;

export function encodeId(id: number): string {
    return (id ^ MASK).toString(36);
}

export function decodeId(encoded: string): number {
    return parseInt(encoded, 36) ^ MASK;
}
