/**
 * Produces deduplicated trigrams from normalized text.
 * @param {string} str
 * @returns {string[]}
 */
export function generateTrigrams(str) {
  const s = str.toLowerCase().replace(/\s+/g, ' ');
  const set = new Set();
  for (let i = 0; i <= s.length - 3; i++) {
    set.add(s.slice(i, i + 3));
  }
  return [...set];
}
