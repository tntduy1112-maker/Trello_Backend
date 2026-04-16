const crypto = require('crypto');

const ALGO = 'aes-256-gcm';

// KEY must be 32 bytes (64 hex chars) from COOKIE_ENCRYPTION_KEY env var
const getKey = () => {
  const hex = process.env.COOKIE_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('COOKIE_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
};

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Output format (hex): [iv 24 chars][authTag 32 chars][ciphertext n chars]
 */
const encrypt = (plaintext) => {
  const iv = crypto.randomBytes(12); // 96-bit IV — recommended for GCM
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16 bytes
  return iv.toString('hex') + authTag.toString('hex') + encrypted.toString('hex');
};

/**
 * Decrypt a ciphertext produced by encrypt().
 * Throws if the ciphertext has been tampered with (GCM authTag mismatch).
 */
const decrypt = (ciphertext) => {
  if (!ciphertext || ciphertext.length < 56) {
    throw new Error('Invalid ciphertext');
  }
  const iv = Buffer.from(ciphertext.slice(0, 24), 'hex');        // 12 bytes
  const authTag = Buffer.from(ciphertext.slice(24, 56), 'hex');  // 16 bytes
  const encrypted = Buffer.from(ciphertext.slice(56), 'hex');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
};

module.exports = { encrypt, decrypt };
