const jwt = require('jsonwebtoken');
const env = require('../configs/env');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpires,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwt.accessSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwt.refreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
