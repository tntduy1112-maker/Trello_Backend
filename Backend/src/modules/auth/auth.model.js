const { query } = require('../../configs/postgres');
const redis = require('../../configs/redis');

const createUser = async (email, passwordHash, fullName) => {
  const result = await query(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, avatar_url, is_verified, is_active, created_at, updated_at`,
    [email, passwordHash, fullName]
  );
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await query(
    `SELECT id, email, password_hash, full_name, avatar_url, is_verified, is_active, created_at, updated_at
     FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

const findUserById = async (id) => {
  const result = await query(
    `SELECT id, email, full_name, avatar_url, is_verified, is_active, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const updateUser = async (id, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findUserById(id);

  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = keys.map((k) => fields[k]);

  const result = await query(
    `UPDATE users SET ${setClauses}, updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, full_name, avatar_url, is_verified, is_active, created_at, updated_at`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

const createRefreshToken = async (userId, tokenHash, expiresAt, deviceInfo) => {
  const result = await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, tokenHash, expiresAt, deviceInfo || null]
  );
  return result.rows[0];
};

const findRefreshToken = async (tokenHash) => {
  const result = await query(
    `SELECT * FROM refresh_tokens WHERE token_hash = $1`,
    [tokenHash]
  );
  return result.rows[0] || null;
};

const revokeRefreshToken = async (tokenHash) => {
  await query(
    `UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1`,
    [tokenHash]
  );
};

const revokeAllUserTokens = async (userId) => {
  await query(
    `UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1`,
    [userId]
  );
};

const createEmailVerification = async (userId, token, type, expiresAt) => {
  const result = await query(
    `INSERT INTO email_verifications (user_id, token, type, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, token, type, expiresAt]
  );
  return result.rows[0];
};

const findEmailVerification = async (token, type) => {
  const result = await query(
    `SELECT * FROM email_verifications WHERE token = $1 AND type = $2`,
    [token, type]
  );
  return result.rows[0] || null;
};

const markEmailVerificationUsed = async (id) => {
  await query(
    `UPDATE email_verifications SET used_at = NOW() WHERE id = $1`,
    [id]
  );
};

// ── Token blacklist (Redis) ──────────────────────────────────────────────────
// Key pattern: blacklist:<jti>
// TTL = seconds until the AT naturally expires — Redis auto-deletes, no cleanup job needed

const addToBlacklist = async (jti, userId, reason, expiresAt) => {
  const ttlSeconds = Math.max(1, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
  // Value stores reason for audit; NX = only set if not exists (idempotent)
  await redis.set(`blacklist:${jti}`, reason, 'EX', ttlSeconds, 'NX');
};

const isBlacklisted = async (jti) => {
  const val = await redis.exists(`blacklist:${jti}`);
  return val === 1;
};

// Stamp tokens_valid_after = NOW() → invalidates all ATs issued before this moment
// Still uses Postgres — this is user state, not ephemeral token state
const invalidateAllUserTokens = async (userId) => {
  await query(
    `UPDATE users SET tokens_valid_after = NOW() WHERE id = $1`,
    [userId]
  );
};

// No-op: Redis TTL handles cleanup automatically
const cleanupBlacklist = async () => {};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  createEmailVerification,
  findEmailVerification,
  markEmailVerificationUsed,
  addToBlacklist,
  isBlacklisted,
  invalidateAllUserTokens,
  cleanupBlacklist,
};
