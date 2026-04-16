const { verifyAccessToken } = require('../utils/jwt');
const { isBlacklisted, findUserById } = require('../modules/auth/auth.model');
const { error } = require('../utils/response');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Unauthorized', 401);
  }

  const token = authHeader.slice(7);
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }

  // Check individual token blacklist (logout, admin revoke)
  if (payload.jti && await isBlacklisted(payload.jti)) {
    return error(res, 'Token has been revoked', 401);
  }

  // Check mass revocation (reuse detected, password reset, account events)
  const user = await findUserById(payload.userId).catch(() => null);
  if (!user || !user.is_active) {
    return error(res, 'Unauthorized', 401);
  }
  if (user.tokens_valid_after && payload.iat < Math.floor(new Date(user.tokens_valid_after).getTime() / 1000)) {
    return error(res, 'Session invalidated. Please log in again.', 401);
  }

  req.user = payload;
  next();
};

module.exports = authenticate;
