const { client } = require('../configs/minio');
const env = require('../configs/env');
const crypto = require('crypto');
const path = require('path');

const BUCKET = env.minio.bucket;

/**
 * Upload a file buffer/stream to MinIO.
 *
 * @param {Object} options
 * @param {Buffer|ReadableStream} options.buffer   - File content
 * @param {string}               options.mimetype  - e.g. "image/jpeg"
 * @param {string}               options.folder    - e.g. "avatars", "attachments"
 * @param {string}               [options.filename] - Original filename (used for extension)
 * @returns {Promise<string>} The stored object name (key)
 */
const uploadFile = async ({ buffer, mimetype, folder = 'uploads', filename = '' }) => {
  const ext = path.extname(filename) || mimeToExt(mimetype);
  const objectName = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

  const size = Buffer.isBuffer(buffer) ? buffer.length : undefined;

  await client.putObject(BUCKET, objectName, buffer, size, { 'Content-Type': mimetype });
  return objectName;
};

/**
 * Delete an object from MinIO by its object name.
 * @param {string} objectName - The stored key returned by uploadFile
 */
const deleteFile = async (objectName) => {
  if (!objectName) return;
  await client.removeObject(BUCKET, objectName);
};

/**
 * Get the public URL for an object.
 * Works when the bucket has a public-read policy (set by initBucket).
 * @param {string} objectName
 * @returns {string}
 */
const getPublicUrl = (objectName) => {
  if (!objectName) return null;
  const { endpoint, port, useSSL } = env.minio;
  const protocol = useSSL ? 'https' : 'http';
  const portStr = (useSSL && port === 443) || (!useSSL && port === 80) ? '' : `:${port}`;
  return `${protocol}://${endpoint}${portStr}/${BUCKET}/${objectName}`;
};

/**
 * Generate a presigned URL for temporary private access.
 * @param {string} objectName
 * @param {number} [expirySeconds=3600]
 * @returns {Promise<string>}
 */
const getPresignedUrl = async (objectName, expirySeconds = 3600) => {
  return client.presignedGetObject(BUCKET, objectName, expirySeconds);
};

// ── helpers ──────────────────────────────────────────────────────────────────

const MIME_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'application/pdf': '.pdf',
  'application/zip': '.zip',
};

const mimeToExt = (mime) => MIME_MAP[mime] || '';

module.exports = { uploadFile, deleteFile, getPublicUrl, getPresignedUrl };
