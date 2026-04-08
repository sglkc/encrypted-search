/**
 * Bloom filter configuration and bit operations used by the encrypted search demo.
 * These constants are part of the indexed data format and must stay stable.
 */
export const BLOOM_BITS = 128;
export const BLOOM_WORDS = 4; // 4 x uint32
export const HASH_COUNT = 5;
export const HASH_SEEDS = [0x12345678, 0x9ABCDEF0, 0x13579BDF, 0x2468ACE0, 0xFEDCBA98];
export const BLOOM_SALT_NAME = 'encrypted-search-poc:name:v1';

/**
 * Computes a deterministic 32-bit FNV-1a hash with a caller-provided seed.
 * @param {string} str
 * @param {number} seed
 * @returns {number}
 */
export function fnv1a32(str, seed) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/**
 * Creates a 128-bit Bloom filter mask for a list of tokens.
 * @param {string[]} items
 * @param {string} salt
 * @returns {Uint32Array}
 */
export function createBloomFilter(items, salt) {
  const f = new Uint32Array(BLOOM_WORDS);
  for (const item of items) {
    const salted = item + salt;
    for (let k = 0; k < HASH_COUNT; k++) {
      const h = fnv1a32(salted, HASH_SEEDS[k]) % BLOOM_BITS;
      f[h >>> 5] |= (1 << (h & 31));
    }
  }
  return f;
}

/**
 * Checks whether a Bloom filter fully contains all bits set in a mask.
 * @param {Uint32Array} filter
 * @param {Uint32Array} mask
 * @returns {boolean}
 */
export function bloomContains(filter, mask) {
  return (((filter[0] & mask[0]) >>> 0) === (mask[0] >>> 0)) &&
    (((filter[1] & mask[1]) >>> 0) === (mask[1] >>> 0)) &&
    (((filter[2] & mask[2]) >>> 0) === (mask[2] >>> 0)) &&
    (((filter[3] & mask[3]) >>> 0) === (mask[3] >>> 0));
}

/**
 * Counts set bits in a Uint32Array Bloom representation.
 * @param {Uint32Array | null} filter
 * @returns {number}
 */
export function countBits(filter) {
  if (!filter) {
    return 0;
  }
  let n = 0;
  for (const w of filter) {
    let v = w;
    while (v) {
      n += v & 1;
      v >>>= 1;
    }
  }
  return n;
}
