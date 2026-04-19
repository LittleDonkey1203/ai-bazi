import { createHash } from 'node:crypto';
import { calculateBazi, type BaziInput, type BaziChart } from '@bazi/engine';
import { getRedis } from '../db/redis.js';

const CACHE_PREFIX = 'bazi:v1:';

/**
 * 取排盘结果。先查 Redis,未命中则算后写回(无 TTL —— 排盘确定性)。
 */
export async function getBaziChart(input: BaziInput): Promise<BaziChart> {
  const key = cacheKey(input);
  const redis = getRedis();
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as BaziChart;
  } catch (err) {
    console.warn('[bazi] redis read failed, falling through:', (err as Error).message);
  }

  const chart = calculateBazi(input);

  try {
    await redis.set(key, JSON.stringify(chart));
  } catch (err) {
    console.warn('[bazi] redis write failed:', (err as Error).message);
  }

  return chart;
}

function cacheKey(input: BaziInput): string {
  const normalized = JSON.stringify({
    y: input.year, m: input.month, d: input.day,
    h: input.hour, mi: input.minute ?? 0,
    g: input.gender,
  });
  const hash = createHash('md5').update(normalized).digest('hex');
  return `${CACHE_PREFIX}${hash}`;
}
