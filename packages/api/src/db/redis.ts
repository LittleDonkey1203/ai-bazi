import Redis from 'ioredis';
import { config } from '../config.js';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    let errorLogged = false;
    client.on('error', (err) => {
      if (!errorLogged) {
        console.warn('[redis] unreachable, falling back to no-cache:', err.message);
        errorLogged = true;
      }
    });
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
    client = null;
  }
}
