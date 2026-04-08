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
 * Initializes dataset generation, progress state, and first render.
 */
async function init() {
  const RECORD_COUNT = 50000;
  const progressBar = document.getElementById('loadProgress');
  const loadingSub = document.getElementById('loadingSub');
  const loadingStat = document.getElementById('loadingStat');

  loadingSub.textContent = 'Generating ' + RECORD_COUNT.toLocaleString() + ' records…';

  await new Promise(r => setTimeout(r, 50));
  progressBar.style.width = '20%';

  await new Promise(r => setTimeout(r, 20));
  loadingSub.textContent = 'Building Bloom filter index…';
  progressBar.style.width = '40%';

  await new Promise(r => setTimeout(r, 20));
  const t0 = performance.now();
  DB = await generateDataset(RECORD_COUNT, cryptoEngine);
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
init();
