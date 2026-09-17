'use strict';
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');
const { tryConnect: redisConnect, getRedisClient } = require('./config/redis');
const { initSocket } = require('./socket');
const { startCronJobs } = require('./jobs/cronJobs');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('[DB] PostgreSQL connected');

    await redisConnect();
    console.log('[Cache] Redis ready (or running without cache)');

    // Phase 6: Khởi động Socket.io
    initSocket(server);
    console.log('[Socket.io] Initialized');

    // Phase 6: Khởi động cron jobs
    startCronJobs();

    server.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error('[Startup] Failed to connect:', err.message);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM — shutting down');
  server.close(() => {
    sequelize.close();
    try { getRedisClient().quit(); } catch { /* Redis not connected */ }
    process.exit(0);
  });
});

start();

module.exports = server;
