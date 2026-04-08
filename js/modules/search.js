import { BLOOM_SALT_NAME, bloomContains, createBloomFilter } from './bloom.js';
import { generateTrigrams } from './trigrams.js';

/**
 * Runs Bloom pre-filtering and in-memory verification for a query.
 * Return shape is intentionally kept identical to the original monolithic script.
 * @param {Array<{filter: Uint32Array, name: string}>} db
 * @param {string} query
 * @returns {{
 *  candidates: Array<any>,
 *  matches: Array<any>,
 *  trigrams?: string[],
 *  mask?: Uint32Array,
 *  timeScan: number,
 *  timeVerify: number
 * }}
 */
export function search(db, query) {
  if (query.length < 3) {
    return { candidates: [], matches: [], timeScan: 0, timeVerify: 0 };
  }

  const trigrams = generateTrigrams(query);
  if (trigrams.length === 0) {
    return { candidates: [], matches: [], timeScan: 0, timeVerify: 0 };
  }

  const mask = createBloomFilter(trigrams, BLOOM_SALT_NAME);

  // Step 3: scan index
  const t0 = performance.now();
  const candidates = [];
  for (let i = 0; i < db.length; i++) {
    if (bloomContains(db[i].filter, mask)) {
      candidates.push(db[i]);
    }
  }
  const timeScan = performance.now() - t0;

  // Step 4+5: decrypt & verify
  const t1 = performance.now();
  const q = query.toLowerCase();
  const matches = candidates.filter(r => r.name.toLowerCase().includes(q));
  const timeVerify = performance.now() - t1;

  return { candidates, matches, trigrams, mask, timeScan, timeVerify };
}
