'use strict';
const Redis = require('ioredis');

let redisClient = null;
let isAvailable = false;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on('error', () => { isAvailable = false; });
    redisClient.on('connect', () => {
      isAvailable = true;
      console.log('[Redis] Connected');
    });
  }
  return redisClient;
};

// Stub dùng khi Redis không khả dụng
const noopClient = {
  get: async () => null,
  set: async () => 'OK',
  setex: async () => 'OK',
  del: async () => 1,
  ping: async () => 'PONG',
};

// Proxy: nếu Redis chạy thì dùng thật, không thì dùng noop
const client = new Proxy(noopClient, {
  get(target, prop) {
    const real = getRedisClient();
    if (isAvailable && typeof real[prop] === 'function') {
      return real[prop].bind(real);
    }
    return target[prop] ?? (() => Promise.resolve(null));
  },
});

// Thử kết nối — không throw nếu Redis không có
async function tryConnect() {
  try {
    await getRedisClient().connect();
    isAvailable = true;
  } catch {
    console.warn('[Redis] Not available — running without cache');
  }
}

module.exports = client;
module.exports.getRedisClient = getRedisClient;
module.exports.tryConnect = tryConnect;
