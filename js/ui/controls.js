/**
 * @typedef {Object} UiControllerDeps
 * @property {() => Array<any>} getDb
 * @property {() => boolean} getShowPlaintext
 * @property {(value: boolean) => void} setShowPlaintext
 * @property {() => any} getLastResult
 * @property {(value: any) => void} setLastResult
 * @property {(db: Array<any>, query: string) => any} search
 * @property {(input: string) => string[]} generateTrigrams
 * @property {(items: string[], salt: string) => Uint32Array} createBloomFilter
 * @property {string} bloomSaltName
 * @property {(db: Array<any>, showPlaintext: boolean, highlightResult: any) => void} renderDbTable
 * @property {(mask: Uint32Array | null) => void} renderBloomGrid
 * @property {(active: number) => void} setStep
 * @property {(trigrams: string[]) => void} renderTrigramPreview
 * @property {() => void} renderTrigramEmptyState
 * @property {() => void} flashInvalidQueryInput
 * @property {(result: any, query: string) => void} renderSearchOutcome
 * @property {(showPlaintext: boolean) => void} updateEncryptionHeaders
 */

/**
 * Creates the UI interaction layer and wires DOM events to application services.
 * @param {UiControllerDeps} deps
 */
export function createUiController(deps) {
  const {
    getDb,
    getShowPlaintext,
    setShowPlaintext,
    getLastResult,
    setLastResult,
    search,
    generateTrigrams,
    createBloomFilter,
    bloomSaltName,
    renderDbTable,
    renderBloomGrid,
    setStep,
    renderTrigramPreview,
    renderTrigramEmptyState,
    flashInvalidQueryInput,
    renderSearchOutcome,
    updateEncryptionHeaders
  } = deps;

  function runSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query.length < 3) {
      flashInvalidQueryInput();
      return;
    }

    setStep(1);
    const trigrams = generateTrigrams(query);
    renderTrigramPreview(trigrams);

    setTimeout(() => {
      setStep(2);
      const mask = createBloomFilter(trigrams, bloomSaltName);
      renderBloomGrid(mask);

      setTimeout(() => {
        setStep(3);
        setTimeout(() => {
          const result = search(getDb(), query);
          setLastResult(result);
          setStep(4);

          setTimeout(() => {
            setStep(5);
            renderSearchOutcome(result, query);
            renderDbTable(getDb(), getShowPlaintext(), result);
          }, 80);
        }, 80);
      }, 60);
    }, 60);
  }

  function setupSearchListeners() {
    document.getElementById('searchBtn').addEventListener('click', runSearch);
    document.getElementById('searchInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        runSearch();
      }
    });

    document.getElementById('searchInput').addEventListener('input', () => {
      const q = document.getElementById('searchInput').value.trim();
      if (q.length >= 3) {
        const tg = generateTrigrams(q);
        renderTrigramPreview(tg);
        const m = createBloomFilter(tg, bloomSaltName);
        renderBloomGrid(m);
      } else {
        renderTrigramEmptyState();
        renderBloomGrid(null);
      }
    });
  }

  function setupEncryptionToggle() {
    const encToggle = document.getElementById('encToggle');
    encToggle.addEventListener('click', () => {
      const next = !getShowPlaintext();
      setShowPlaintext(next);
      encToggle.classList.toggle('on', next);
      encToggle.setAttribute('aria-pressed', String(next));
      updateEncryptionHeaders(next);
      renderDbTable(getDb(), next, getLastResult());
    });

    encToggle.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        encToggle.click();
      }
    });
  }

  function setupThemeToggle() {
    const t = document.querySelector('[data-theme-toggle]');
    const r = document.documentElement;
    let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
    r.setAttribute('data-theme', d);
    if (t) {
      t.addEventListener('click', () => {
        d = d === 'dark' ? 'light' : 'dark';
        r.setAttribute('data-theme', d);
        t.innerHTML = d === 'dark'
          ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
          : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      });
    }
  }

  function setupAllListeners() {
    setupSearchListeners();
    setupEncryptionToggle();
    setupThemeToggle();
  }

  return {
    runSearch,
    setupAllListeners
  };
}
