import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { closeRedis } from '../src/db/redis.js';

const app = buildApp();

describe('POST /api/bazi/chart', () => {
  afterAll(async () => {
    await closeRedis();
  });

  it('排盘正确(1990-08-15 14:30 男)', async () => {
    const res = await request(app)
      .post('/api/bazi/chart')
      .send({ year: 1990, month: 8, day: 15, hour: 14, minute: 30, gender: 'male' });
    expect(res.status).toBe(200);
    expect(res.body.fourPillars.year.stem).toBe('庚');
    expect(res.body.fourPillars.year.branch).toBe('午');
    expect(res.body.fourPillars.day.stem).toBe('壬');
    expect(res.body.pattern).toBe('偏印格');
    expect(res.body.mingGong.stem).toBe('戊');
    expect(res.body.mingGong.branch).toBe('寅');
  });

  it('400 on invalid input', async () => {
    const res = await request(app)
      .post('/api/bazi/chart')
      .send({ year: 2500, month: 8, day: 15, hour: 14, gender: 'male' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });

  it('400 on missing gender', async () => {
    const res = await request(app)
      .post('/api/bazi/chart')
      .send({ year: 1990, month: 8, day: 15, hour: 14 });
    expect(res.status).toBe(400);
  });

  it('404 on unknown route', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
  });
});
