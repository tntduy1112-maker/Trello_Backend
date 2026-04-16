const crypto = require('crypto');
const {
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
  invalidateAllUserTokens,
} = require('./auth.model');
const { hashPassword, comparePassword } = require('../../utils/bcrypt');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../utils/email');

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// Hash a refresh token with SHA-256 before storing/looking up in DB.
// The raw token goes to the client; only the hash lives in the database.
const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

const register = async (email, password, fullName) => {
  const existing = await findUserByEmail(email);
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash, fullName);

  // Create 6-digit OTP (15 minutes)
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await createEmailVerification(user.id, otp, 'verify_email', expiresAt);

  // Send OTP email (non-blocking)
  sendVerificationEmail(email, fullName, otp).catch((err) =>
    console.error('Failed to send verification email:', err.message)
  );

  return user;
};

const verifyEmail = async (email, otp) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.is_verified) {
    const err = new Error('Email is already verified');
    err.statusCode = 400;
    throw err;
  }

  const record = await findEmailVerification(otp, 'verify_email');
  if (!record || record.user_id !== user.id) {
    const err = new Error('Invalid OTP code');
    err.statusCode = 400;
    throw err;
  }
  if (record.used_at) {
    const err = new Error('OTP has already been used');
    err.statusCode = 400;
    throw err;
  }
  if (new Date(record.expires_at) < new Date()) {
    const err = new Error('OTP has expired. Please request a new one.');
    err.statusCode = 400;
    throw err;
  }

  await markEmailVerificationUsed(record.id);
  await updateUser(record.user_id, { is_verified: true });
};

const resendVerification = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.is_verified) {
    const err = new Error('Email is already verified');
    err.statusCode = 400;
    throw err;
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await createEmailVerification(user.id, otp, 'verify_email', expiresAt);

  sendVerificationEmail(email, user.full_name, otp).catch((err) =>
    console.error('Failed to resend verification email:', err.message)
  );
};

const login = async (email, password, deviceInfo) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  if (!user.is_active) {
    const err = new Error('Account is disabled');
    err.statusCode = 403;
    throw err;
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const payload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshTokenValue = generateRefreshToken(payload);

  const decoded = verifyRefreshToken(refreshTokenValue);
  const expiresAt = new Date(decoded.exp * 1000).toISOString();

  await createRefreshToken(user.id, hashToken(refreshTokenValue), expiresAt, deviceInfo);

  const { password_hash, ...safeUser } = user;
  return { accessToken, refreshToken: refreshTokenValue, user: safeUser };
};

const refreshToken = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  const stored = await findRefreshToken(hashToken(token));

  if (!stored) {
    const err = new Error('Refresh token not found');
    err.statusCode = 401;
    throw err;
  }

  // ── Reuse detection ────────────────────────────────────────────────────────
  // A revoked RT being presented means it was stolen — nuke all sessions
  if (stored.is_revoked) {
    await revokeAllUserTokens(stored.user_id);
    await invalidateAllUserTokens(stored.user_id);
    const err = new Error('Security alert: token reuse detected. All sessions have been invalidated.');
    err.statusCode = 401;
    throw err;
  }

  if (new Date(stored.expires_at) < new Date()) {
    const err = new Error('Refresh token has expired');
    err.statusCode = 401;
    throw err;
  }

  const user = await findUserById(decoded.userId);
  if (!user || !user.is_active) {
    const err = new Error('User not found or inactive');
    err.statusCode = 401;
    throw err;
  }

  // ── Rotation: revoke old RT, issue new RT ──────────────────────────────────
  await revokeRefreshToken(hashToken(token));

  const payload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  const newDecoded = verifyRefreshToken(newRefreshToken);
  const expiresAt = new Date(newDecoded.exp * 1000).toISOString();
  await createRefreshToken(user.id, hashToken(newRefreshToken), expiresAt, stored.device_info);

  return { accessToken, newRefreshToken };
};

const logout = async (token, accessTokenDecoded) => {
  await revokeRefreshToken(hashToken(token));
  // Blacklist the current access token so it can't be reused during its remaining TTL
  if (accessTokenDecoded?.jti && accessTokenDecoded?.userId && accessTokenDecoded?.exp) {
    await addToBlacklist(
      accessTokenDecoded.jti,
      accessTokenDecoded.userId,
      'logout',
      new Date(accessTokenDecoded.exp * 1000).toISOString()
    ).catch(() => {}); // non-blocking — don't fail logout if blacklist insert fails
  }
};

const logoutAll = async (userId) => {
  await revokeAllUserTokens(userId);
};

const forgotPassword = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) return; // Silent — don't reveal if email exists

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  await createEmailVerification(user.id, token, 'reset_password', expiresAt);

  sendPasswordResetEmail(email, user.full_name, token).catch((err) =>
    console.error('Failed to send reset email:', err.message)
  );
};

const resetPassword = async (token, newPassword) => {
  const record = await findEmailVerification(token, 'reset_password');

  if (!record) {
    const err = new Error('Invalid reset token');
    err.statusCode = 400;
    throw err;
  }
  if (record.used_at) {
    const err = new Error('Token has already been used');
    err.statusCode = 400;
    throw err;
  }
  if (new Date(record.expires_at) < new Date()) {
    const err = new Error('Reset token has expired');
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await hashPassword(newPassword);
  await markEmailVerificationUsed(record.id);
  await updateUser(record.user_id, { password_hash: passwordHash });
  await revokeAllUserTokens(record.user_id);
  await invalidateAllUserTokens(record.user_id); // invalidate any in-flight access tokens
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
};
