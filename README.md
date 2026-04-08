# Encrypted Search POC (Static, No Bundler)

This project demonstrates substring search over encrypted-like records using:
- Trigram tokenization
- 128-bit Bloom filters
- Candidate verification in memory

The implementation is intentionally static:
- Plain HTML
- External CSS
- Vanilla JavaScript ES modules
- No build step and no bundler

## What Was Refactored

The original monolithic page was split into dedicated files by responsibility while preserving behavior, constants, timings, and UI interactions.

- Styles moved from inline style tags to external CSS.
- Script logic moved from inline script tags to browser-native ES modules.
- Core interfaces were documented and isolated so components are replaceable.

## Project Structure

```text
encrypted-search/
├── index.html
├── css/
│   └── main.css
└── js/
    ├── app.js
    ├── modules/
    │   ├── bloom.js
    │   ├── crypto.js
    │   ├── data.js
    │   ├── search.js
    │   └── trigrams.js
    └── ui/
        ├── controls.js
        └── render.js
```

## Module Responsibilities

- js/modules/bloom.js
  - Bloom filter constants, hashing, bit operations, membership checks.

- js/modules/trigrams.js
  - Query/name trigram generation.

- js/modules/crypto.js
  - Encryption abstraction and the current XOR demo engine implementation.

- js/modules/data.js
  - Deterministic dataset generation, encryption precompute, and Bloom index creation.

- js/modules/search.js
  - Search pipeline: trigram mask -> Bloom scan -> verification.

- js/ui/render.js
  - UI rendering functions (table, Bloom grid, stats, result cards, step state).

- js/ui/controls.js
  - Event wiring and interaction flow (search actions, input updates, toggles).

- js/app.js
  - Composition root and app initialization lifecycle.

## Replaceable Interface: Crypto Engine

The crypto module defines a documented engine contract to support replacement of XOR with stronger algorithms (for example AES via Web Crypto) without touching search, rendering, or event modules.

Current contract in practice:
- encrypt(plaintext) -> Promise<string>
- decrypt(ciphertext) -> Promise<string>
- optional fast-path methods:
  - encryptSync(plaintext) -> string
  - decryptSync(ciphertext) -> string

How to replace XOR:
1. Implement a new engine object with the same function signatures.
2. In js/app.js, replace createXorCryptoEngine() with your engine factory.
3. Keep ciphertext output type as string if you want zero downstream changes.

## Run Locally

Because this uses ES module imports, serve the directory over HTTP instead of opening the file directly from disk.

## Behavior Preservation Notes

The refactor intentionally keeps current implementation behavior, including:
- Bloom constants and hash seeds
- Salt string used for name indexing
- Dataset size and deterministic seeded RNG
- Search step timing animation and update order
- Theme toggle behavior
- Encryption display toggle behavior

## Non-Goals

- No algorithm changes
- No design changes
- No dependency changes
- No bundler/tooling changes
