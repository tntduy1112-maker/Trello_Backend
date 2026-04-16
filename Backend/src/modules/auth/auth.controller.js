const authService = require('./auth.service');
const { findUserById } = require('./auth.model');
const { success, error } = require('../../utils/response');
const { encrypt, decrypt } = require('../../utils/tokenCrypto');
const { verifyAccessToken } = require('../../utils/jwt');

const register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    const user = await authService.register(email, password, fullName);
    return success(res, { user }, 'Registration successful. Please check your email to verify your account.', 201);
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return error(res, 'Email and OTP are required', 400);
    await authService.verifyEmail(email, otp);
    return success(res, null, 'Email verified successfully. You can now log in.');
  } catch (err) {
    next(err);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email is required', 400);
    await authService.resendVerification(email);
    return success(res, null, 'Verification email resent. Please check your inbox.');
  } catch (err) {
    next(err);
  }
};

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const deviceInfo = req.headers['user-agent'] || null;
    const { accessToken, refreshToken, user } = await authService.login(email, password, deviceInfo);
    res.cookie('refreshToken', encrypt(refreshToken), COOKIE_OPTS);
    return success(res, { accessToken, user }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const encrypted = req.cookies?.refreshToken;
    if (!encrypted) return error(res, 'Refresh token required', 400);
    const token = decrypt(encrypted);
    const { accessToken, newRefreshToken } = await authService.refreshToken(token);
    // Rotation: set the new encrypted refresh token cookie
    res.cookie('refreshToken', encrypt(newRefreshToken), COOKIE_OPTS);
    return success(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const encrypted = req.cookies?.refreshToken;
    // Decode current access token to blacklist its jti (best-effort, no throw)
    let accessTokenDecoded = null;
    try {
      const bearer = req.headers['authorization']?.slice(7);
      if (bearer) accessTokenDecoded = verifyAccessToken(bearer);
    } catch { /* expired or invalid AT — still proceed with logout */ }

    if (encrypted) {
      try {
        const token = decrypt(encrypted);
        await authService.logout(token, accessTokenDecoded);
      } catch {
        // tampered or invalid cookie — clear it and proceed
      }
    }
    res.clearCookie('refreshToken', COOKIE_OPTS);
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) return error(res, 'User not found', 404);
    return success(res, { user }, 'User retrieved');
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email is required', 400);
    await authService.forgotPassword(email);
    return success(res, null, 'If the email exists, a password reset link has been sent.');
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token) return error(res, 'Token is required', 400);
    if (!password || password.length < 6) return error(res, 'Password must be at least 6 characters', 400);
    await authService.resetPassword(token, password);
    return success(res, null, 'Password reset successfully. Please log in again.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
