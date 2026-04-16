const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../configs/env');

const generateAccessToken = (payload) => {
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires }
  );
};

const generateRefreshToken = (payload) => {
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpires }
  );
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
