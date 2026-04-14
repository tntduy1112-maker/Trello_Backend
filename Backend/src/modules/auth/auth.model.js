const { query } = require('../../configs/postgres');

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

const createRefreshToken = async (userId, token, expiresAt, deviceInfo) => {
  const result = await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at, device_info)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, token, expiresAt, deviceInfo || null]
  );
  return result.rows[0];
};

const findRefreshToken = async (token) => {
  const result = await query(
    `SELECT * FROM refresh_tokens WHERE token = $1`,
    [token]
  );
  return result.rows[0] || null;
};

const revokeRefreshToken = async (token) => {
  await query(
    `UPDATE refresh_tokens SET is_revoked = true WHERE token = $1`,
    [token]
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
};
