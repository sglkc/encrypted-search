import { BLOOM_SALT_NAME, createBloomFilter } from './bloom.js';
import { generateTrigrams } from './trigrams.js';

/**
 * @typedef {import('./crypto.js').CryptoEngine} CryptoEngine
 */

/**
 * Reference names used to build the deterministic demo dataset.
 */
export const FIRST_NAMES = ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Rachel', 'Samuel', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zoe', 'Aaron', 'Beth', 'Carl', 'Diana', 'Eric', 'Fiona', 'George', 'Hannah', 'Ivan', 'Julia', 'Kevin', 'Laura', 'Mike', 'Nancy', 'Oscar', 'Paula', 'Robert', 'Sarah', 'Thomas', 'Ursula', 'Vera', 'William', 'Xena', 'Yvonne', 'John', 'Jane', 'James', 'Mary', 'Alex', 'Chris', 'Jessica', 'Daniel', 'Ashley', 'Matthew'];
export const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Morris', 'Rogers', 'Reed'];
export const DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'company.io', 'example.org', 'work.com', 'startup.dev'];

/**
 * Creates a deterministic linear congruential generator for repeatable records.
 * @param {number} seed
 * @returns {() => number}
 */
export function lcgRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/**
 * Builds the in-memory dataset and pre-computes encrypted fields and Bloom filters.
 * @param {number} count
 * @param {CryptoEngine} cryptoEngine
 * @returns {Promise<Array<{
 *   id: number,
 *   name: string,
 *   email: string,
 *   encName: string,
 *   encEmail: string,
 *   filter: Uint32Array
 * }>>}
 */
export async function generateDataset(count, cryptoEngine) {
  const rng = lcgRng(42);
  const records = [];
  const hasSyncEncrypt = typeof cryptoEngine.encryptSync === 'function';

  for (let i = 0; i < count; i++) {
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const domain = DOMAINS[Math.floor(rng() * DOMAINS.length)];
    const name = fn + ' ' + ln;
    const email = fn.toLowerCase() + '.' + ln.toLowerCase() + '@' + domain;
    const trigrams = generateTrigrams(name);
    const filter = createBloomFilter(trigrams, BLOOM_SALT_NAME);

    const encName = hasSyncEncrypt
      ? cryptoEngine.encryptSync(name)
      : await cryptoEngine.encrypt(name);
    const encEmail = hasSyncEncrypt
      ? cryptoEngine.encryptSync(email)
      : await cryptoEngine.encrypt(email);

    records.push({
      id: i + 1,
      name,
      email,
      encName,
      encEmail,
      filter
    });
  }

  return records;
}
