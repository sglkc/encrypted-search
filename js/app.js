import { BLOOM_SALT_NAME, createBloomFilter } from './modules/bloom.js';
import { createXorCryptoEngine } from './modules/crypto.js';
import { generateDataset } from './modules/data.js';
import { search } from './modules/search.js';
import { generateTrigrams } from './modules/trigrams.js';
import {
  flashInvalidQueryInput,
  renderBloomGrid,
  renderDbTable,
  renderSearchOutcome,
  renderTrigramEmptyState,
  renderTrigramPreview,
  setStep,
  updateEncryptionHeaders
} from './ui/render.js';
import { createUiController } from './ui/controls.js';

const DEFAULT_RECORD_COUNT = 5000;

let DB = [];
let showPlaintext = false;
let lastResult = null;

const cryptoEngine = createXorCryptoEngine();

const uiController = createUiController({
  getDb: () => DB,
  getShowPlaintext: () => showPlaintext,
  setShowPlaintext: value => {
    showPlaintext = value;
  },
  getLastResult: () => lastResult,
  setLastResult: value => {
    lastResult = value;
  },
  search,
  generateTrigrams,
  createBloomFilter,
  bloomSaltName: BLOOM_SALT_NAME,
  renderDbTable,
  renderBloomGrid,
  setStep,
  renderTrigramPreview,
  renderTrigramEmptyState,
  flashInvalidQueryInput,
  renderSearchOutcome,
  updateEncryptionHeaders
});

/**
 * Parses and sanitizes record count from URL query params.
 * Defaults to 5000 when param is missing or invalid.
 * @returns {number}
 */
function getRecordCountFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('datasize');

  if (!raw) {
    return DEFAULT_RECORD_COUNT;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_RECORD_COUNT;
  }

  return parsed;
}

/**
 * Wires record count controls to update query params and refresh the page.
 * @param {number} initialRecordCount
 */
function setupRecordCountControls(initialRecordCount) {
  const input = document.getElementById('recordCountInput');
  const setButton = document.getElementById('setRecordCountBtn');
  if (!input || !setButton) {
    return;
  }

  input.value = String(initialRecordCount);

  const applyRecordCount = () => {
    const parsed = Number.parseInt(input.value, 10);
    const nextRecordCount = Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_RECORD_COUNT;

    input.value = String(nextRecordCount);

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('datasize', String(nextRecordCount));

    if (nextUrl.toString() === window.location.href) {
      window.location.reload();
      return;
    }

    window.location.href = nextUrl.toString();
  };

  setButton.addEventListener('click', applyRecordCount);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      applyRecordCount();
    }
  });
}

/**
 * Initializes dataset generation, progress state, and first render.
 */
async function init(recordCount) {
  const progressBar = document.getElementById('loadProgress');
  const loadingSub = document.getElementById('loadingSub');
  const loadingStat = document.getElementById('loadingStat');

  loadingSub.textContent = 'Generating ' + recordCount.toLocaleString() + ' records…';

  await new Promise(r => setTimeout(r, 50));
  progressBar.style.width = '20%';

  await new Promise(r => setTimeout(r, 20));
  loadingSub.textContent = 'Building Bloom filter index…';
  progressBar.style.width = '40%';

  await new Promise(r => setTimeout(r, 20));
  const t0 = performance.now();
  DB = await generateDataset(recordCount, cryptoEngine);
  const buildTime = (performance.now() - t0).toFixed(0);

  progressBar.style.width = '75%';
  loadingSub.textContent = 'Encrypting records…';
  loadingStat.textContent = `Index built in ${buildTime}ms`;

  await new Promise(r => setTimeout(r, 30));
  progressBar.style.width = '90%';
  loadingSub.textContent = 'Rendering interface…';

  await new Promise(r => setTimeout(r, 30));

  renderBloomGrid(null);
  renderDbTable(DB, showPlaintext, null);

  progressBar.style.width = '100%';
  await new Promise(r => setTimeout(r, 200));

  document.getElementById('loadingOverlay').style.display = 'none';
  document.getElementById('appRoot').style.visibility = 'visible';
}

uiController.setupAllListeners();
const recordCount = getRecordCountFromQuery();
setupRecordCountControls(recordCount);
init(recordCount);
