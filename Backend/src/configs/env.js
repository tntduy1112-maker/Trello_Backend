const path = require('path');
const fs = require('fs');

const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = path.resolve(process.cwd(), `.env.${NODE_ENV}`);

if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
} else {
  require('dotenv').config(); // fallback to .env
}

console.log(`[ENV] Loaded: .env.${NODE_ENV}`);

module.exports = {
  NODE_ENV,
  IS_DEV: NODE_ENV === 'development',
  IS_PROD: NODE_ENV === 'production',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  SWAGGER_ENABLED: process.env.SWAGGER_ENABLED === 'true',
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM,
  },
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  COOKIE_ENCRYPTION_KEY: process.env.COOKIE_ENCRYPTION_KEY,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || 'redispass',
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT, 10) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'taskflow',
  },
};
