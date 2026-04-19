import { config, assertProdConfig } from './config.js';
import { buildApp } from './app.js';
import { closeRedis } from './db/redis.js';
import { closePrisma } from './db/prisma.js';

assertProdConfig();

const app = buildApp();
const server = app.listen(config.port, () => {
  console.log(`[api] listening on http://localhost:${config.port} (${config.nodeEnv})`);
});

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`[api] ${signal} received, shutting down…`);
  server.close(() => console.log('[api] http server closed'));
  await Promise.allSettled([closeRedis(), closePrisma()]);
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
