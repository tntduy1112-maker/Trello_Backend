const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/response');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Unauthorized', 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
};

module.exports = authenticate;
