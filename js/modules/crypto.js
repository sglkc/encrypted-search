/**
 * @typedef {Object} CryptoEngine
 * @property {(plaintext: string) => Promise<string>} encrypt Encrypts plaintext for storage.
 * @property {(ciphertext: string) => Promise<string>} decrypt Decrypts storage ciphertext.
 * @property {(plaintext: string) => string} [encryptSync] Optional sync fast-path.
 * @property {(ciphertext: string) => string} [decryptSync] Optional sync fast-path.
 */

// Demo key used by the XOR simulation cipher.
const ENC_KEY = new Uint8Array([0x4B, 0x6E, 0x23, 0x8F, 0xA1, 0x2C, 0x77, 0xE9, 0x55, 0x3D, 0xB2, 0x91, 0x6F, 0x48, 0xC0, 0x85]);

/**
 * XOR-based demo encryption that preserves existing page behavior.
 * @param {string} str
 * @returns {string}
 */
function xorEncryptSync(str) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    out += String.fromCharCode(str.charCodeAt(i) ^ ENC_KEY[i % ENC_KEY.length]);
  }
  return btoa(out).replace(/=+$/, '');
}

/**
 * XOR-based demo decryption matching the legacy implementation.
 * @param {string} b64
 * @returns {string}
 */
function xorDecryptSync(b64) {
  try {
    const pad = b64 + '==='.slice((b64.length * 3) % 4 === 0 ? 4 : (b64.length * 3) % 4);
    const str = atob(pad);
    let out = '';
    for (let i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ ENC_KEY[i % ENC_KEY.length]);
    }
    return out;
  } catch {
    return '??';
  }
}

/**
 * Creates a crypto engine compatible with future async algorithms (for example AES via Web Crypto).
 * @returns {CryptoEngine}
 */
export function createXorCryptoEngine() {
  return {
    async encrypt(plaintext) {
      return xorEncryptSync(plaintext);
    },
    async decrypt(ciphertext) {
      return xorDecryptSync(ciphertext);
    },
    encryptSync(plaintext) {
      return xorEncryptSync(plaintext);
    },
    decryptSync(ciphertext) {
      return xorDecryptSync(ciphertext);
    }
  };
}
