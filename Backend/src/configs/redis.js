const Redis = require('ioredis');
const env = require('./env');

const client = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password || undefined,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

client.on('connect', () => console.log('[Redis] Connected'));
client.on('error', (err) => console.error('[Redis] Error:', err.message));

module.exports = client;
