import { countBits } from '../modules/bloom.js';

/**
 * Renders the database table (first 200 rows) with optional candidate/match highlighting.
 * @param {Array<{id:number,name:string,email:string,encName:string,encEmail:string,filter:Uint32Array}>} db
 * @param {boolean} showPlaintext
 * @param {{candidates:Array<{id:number}>,matches:Array<{id:number}>} | null} highlightResult
 */
export function renderDbTable(db, showPlaintext, highlightResult) {
  const tbody = document.getElementById('dbTableBody');
  const rows = db.slice(0, 200);
  const candidateIds = new Set();
  const matchIds = new Set();

  if (highlightResult) {
    highlightResult.candidates.forEach(r => candidateIds.add(r.id));
    highlightResult.matches.forEach(r => matchIds.add(r.id));
  }

  let html = '';
  for (const r of rows) {
    const isMatch = matchIds.has(r.id);
    const isCand = candidateIds.has(r.id) && !isMatch;
    const isFP = isCand && highlightResult;
    const cls = isMatch ? 'highlight-match' : isCand ? 'highlight-candidate' : '';

    let bloomHtml = '<div class="bloom-mini">';
    for (let b = 0; b < 32; b++) {
      const wordIdx = b >>> 3;
      const bitIdx = b & 7;
      const on = (r.filter[wordIdx] >>> bitIdx) & 1;
      bloomHtml += `<div class="bloom-mini-bit${on ? ' on' : ''}"></div>`;
    }
    bloomHtml += '</div>';

    const nameCell = showPlaintext ? r.name : `<span class="cipher-text">${r.encName.slice(0, 16)}…</span>`;
    const emailCell = showPlaintext ? r.email : `<span class="cipher-text">${r.encEmail.slice(0, 16)}…</span>`;

    html += `<tr class="${cls}" data-id="${r.id}">
      <td class="uid-cell">${r.id}</td>
      <td title="${r.name}">${nameCell}</td>
      <td title="${r.email}">${emailCell}</td>
      <td>${bloomHtml}</td>
    </tr>`;
  }

  tbody.innerHTML = html;
  document.getElementById('dbSubtitle').textContent =
    `Showing 200 of ${db.length.toLocaleString()} records`;
  document.getElementById('recordCountBadge').textContent =
    `${db.length.toLocaleString()} records`;
}

/**
 * Renders the active 128-bit query Bloom mask visualization.
 * @param {Uint32Array | null} mask
 */
export function renderBloomGrid(mask) {
  const grid = document.getElementById('bloomGrid');
  const bits = countBits(mask);
  document.getElementById('bitsSetBadge').textContent = bits + ' bits set';

  let html = '';
  for (let b = 0; b < 128; b++) {
    const wordIdx = b >>> 5;
    const bitIdx = b & 31;
    const on = mask ? ((mask[wordIdx] >>> bitIdx) & 1) : 0;
    html += `<div class="bloom-bit${on ? ' on' : ''}"></div>`;
  }
  grid.innerHTML = html;
}

/**
 * Updates the five-step algorithm progress indicator.
 * @param {number} active
 */
export function setStep(active) {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById('step' + i);
    el.classList.remove('active', 'done');
    if (i < active) {
      el.classList.add('done');
    }
    if (i === active) {
      el.classList.add('active');
    }
  }
}

/**
 * Wraps the first case-insensitive query match in a mark tag.
 * @param {string} text
 * @param {string} query
 * @returns {string}
 */
export function highlight(text, query) {
  if (!query) {
    return text;
  }
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) {
    return text;
  }
  return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
}

/**
 * Temporarily highlights the search input border for invalid short queries.
 */
export function flashInvalidQueryInput() {
  const input = document.getElementById('searchInput');
  input.style.borderColor = 'var(--color-error)';
  setTimeout(() => {
    input.style.borderColor = '';
  }, 600);
}

/**
 * Renders trigram chips and count for the current query.
 * @param {string[]} trigrams
 */
export function renderTrigramPreview(trigrams) {
  document.getElementById('trigramList').innerHTML = trigrams.map(t =>
    `<span class="trigram-chip">${t}</span>`).join('');
  document.getElementById('trigramCount').textContent = trigrams.length + ' trigrams';
}

/**
 * Restores the empty trigram state when input has fewer than 3 characters.
 */
export function renderTrigramEmptyState() {
  document.getElementById('trigramList').innerHTML = '<span class="trigram-empty">Type ≥3 characters…</span>';
  document.getElementById('trigramCount').textContent = '0 trigrams';
}

/**
 * Updates result stats, performance bars, and rendered match cards.
 * @param {{candidates:Array<any>,matches:Array<any>,timeScan:number,timeVerify:number}} result
 * @param {string} query
 */
export function renderSearchOutcome(result, query) {
  const fp = result.candidates.length - result.matches.length;
  document.getElementById('statCandidates').textContent = result.candidates.length.toLocaleString();
  document.getElementById('statMatches').textContent = result.matches.length.toLocaleString();
  document.getElementById('statFP').textContent = fp.toLocaleString();

  const scanMs = result.timeScan.toFixed(2);
  const verMs = result.timeVerify.toFixed(2);
  const totalMs = (result.timeScan + result.timeVerify).toFixed(2);
  document.getElementById('perfScan').textContent = scanMs + 'ms';
  document.getElementById('perfVerify').textContent = verMs + 'ms';
  document.getElementById('totalTimeBadge').textContent = totalMs + 'ms total';

  const maxMs = Math.max(result.timeScan, result.timeVerify, 1);
  document.getElementById('perfScanBar').style.width = Math.min(100, (result.timeScan / maxMs) * 100) + '%';
  document.getElementById('perfVerifyBar').style.width = Math.min(100, (result.timeVerify / maxMs) * 100) + '%';

  document.getElementById('resultsBadge').textContent = result.matches.length + ' matches';

  if (result.matches.length === 0) {
    document.getElementById('resultsList').innerHTML =
      '<div class="results-empty"><div class="results-empty-icon">🔍</div>No matches found for "' + query + '"</div>';
  } else {
    const top50 = result.matches.slice(0, 50);
    document.getElementById('resultsList').innerHTML = '<div class="results-list">' +
      top50.map(r => {
        const initials = r.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return `<div class="result-item">
                  <div class="result-avatar">${initials}</div>
                  <div class="result-info">
                    <div class="result-name">${highlight(r.name, query)}</div>
                    <div class="result-email">${r.email}</div>
                  </div>
                  <div class="result-uid">#${r.id}</div>
                </div>`;
      }).join('') +
      (result.matches.length > 50 ? `<div style="text-align:center;padding:var(--space-3);font-size:var(--text-xs);color:var(--color-text-muted)">+${result.matches.length - 50} more results</div>` : '') +
      '</div>';
  }
}

/**
 * Updates table headers to match encryption display mode.
 * @param {boolean} showPlaintext
 */
export function updateEncryptionHeaders(showPlaintext) {
  document.querySelector('thead tr th:nth-child(2)').textContent =
    showPlaintext ? 'Name (plaintext)' : 'Name (encrypted)';
  document.querySelector('thead tr th:nth-child(3)').textContent =
    showPlaintext ? 'Email (plaintext)' : 'Email (encrypted)';
}
