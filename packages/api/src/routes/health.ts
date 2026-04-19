import express, { type Router as RouterType } from 'express';
import { getRedis } from '../db/redis.js';

const { Router } = express;
const router: RouterType = Router();

router.get('/', async (_req, res) => {
  const out: Record<string, unknown> = { ok: true, time: new Date().toISOString() };

  try {
    const redis = getRedis();
    const pong = await redis.ping();
    out.redis = pong === 'PONG' ? 'ok' : pong;
  } catch (err) {
    out.redis = `error: ${(err as Error).message}`;
  }

  res.json(out);
});

export default router;
