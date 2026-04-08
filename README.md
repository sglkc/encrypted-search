# Encrypted Search POC

This project is a browser demo of substring search over encrypted data using trigrams and Bloom filters.

The design is inspired by this article:
- Efficient Substring Search Over Encrypted Data: Achieving 10ms Latency for Millions of Records
  - https://medium.com/@shiftan/efficient-substring-search-over-encrypted-data-achieving-10ms-latency-for-millions-of-records-0621686b748a

## Why This Exists

Field-level encryption protects sensitive data, but it breaks normal substring queries.

If values are encrypted, a database cannot directly evaluate text operators like contains, prefix, or suffix against ciphertext. This demo shows a practical pattern:
- Keep encrypted values for storage
- Keep a compact deterministic index for search pre-filtering
- Decrypt only candidate rows for final verification

## High-Level Idea

The searchable index uses:
- Trigrams (3-character chunks)
- A fixed-size Bloom filter per record
- Bitwise mask checks to quickly eliminate non-matches

This gives a fast candidate set while keeping false positives manageable. Final correctness comes from in-memory verification after candidate retrieval.

## Algorithm

### Insert / Index Path

1. Normalize plaintext input.
2. Split the string into trigrams.
3. Hash trigrams into a 128-bit Bloom filter using 5 hash functions.
4. Salt the index input per indexed field.
5. Encrypt the plaintext value for storage.
6. Store encrypted value + Bloom index.

### Search Path

1. Normalize query and generate trigrams.
2. Build a Bloom mask from query trigrams.
3. Scan record indexes with a bitwise contains check.
4. Collect candidate records.
5. Verify candidates with real substring matching in memory.
6. Return only true matches.

## Why Trigrams + Bloom Filters

- Position-independent indexing: good for substring-like matching.
- Very fast checks: bitwise operations are cheap.
- Space efficient relative to storing many deterministic indexes.
- Tunable tradeoff between index size and false-positive rate.

## Security Notes

- This demo models application-level encryption behavior but is not production cryptography.
- The current demo cipher is XOR for simplicity and visualization.
- In production, use authenticated encryption (for example AES-GCM) and proper key management.
- Salting index inputs helps reduce cross-column and cross-deployment correlation.
- Bloom filters are probabilistic and can leak patterns if used carelessly; threat-modeling is required for real systems.

## What This Demo Is (and Is Not)

This demo is:
- A static educational POC
- A visualization of the candidate filtering pipeline
- A modular codebase where crypto can be replaced

This demo is not:
- A complete searchable encryption product
- A benchmark equivalent to distributed production systems
- A substitute for formal cryptographic review

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

## Module Map

- js/modules/bloom.js: Bloom constants, hashing, filter creation, contains checks.
- js/modules/trigrams.js: trigram generation.
- js/modules/search.js: candidate scan + verification flow.
- js/modules/data.js: deterministic demo data generation and indexing.
- js/modules/crypto.js: pluggable crypto engine interface + current XOR implementation.
- js/ui/render.js: UI rendering and visual state updates.
- js/ui/controls.js: event wiring and interaction orchestration.
- js/app.js: application bootstrap and dependency wiring.

## Crypto Interface (Replaceable)

The app is built so encryption can be swapped without rewriting search or UI.

Current engine contract:
- encrypt(plaintext) -> Promise<string>
- decrypt(ciphertext) -> Promise<string>
- optional sync fast path:
  - encryptSync(plaintext) -> string
  - decryptSync(ciphertext) -> string

To switch from XOR to AES, implement the same contract and replace the engine factory in js/app.js.

## Run Locally

Use a static server (ES modules require HTTP, not file://):

```bash
git clone https://github.com/sglkc/encrypted-search.git
cd encrypted-search
npx http-server
```

Open http://localhost:8080
