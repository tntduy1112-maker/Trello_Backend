const bcrypt = require('bcryptjs');

const ROUNDS = 10;

const hashPassword = (password) => {
  return bcrypt.hash(password, ROUNDS);
};

const comparePassword = (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = { hashPassword, comparePassword };
