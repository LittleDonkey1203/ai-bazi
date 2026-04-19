import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });
dotenv.config({ path: resolve(process.cwd(), '.env'), override: true });

export const config = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-CHANGE-ME',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  llm: {
    apiBase: process.env.API_BASE ?? 'https://api.viviai.cc/v1',
    apiKey: process.env.API_KEY ?? '',
    model: process.env.MODEL ?? 'gemini-3-pro-preview',
  },
  rateLimit: {
    windowMs: 60 * 1000,
    chartMax: 20,
    chatMax: 20,
  },
} as const;

export function assertProdConfig(): void {
  if (config.nodeEnv === 'production') {
    if (!config.jwtSecret || config.jwtSecret === 'dev-secret-CHANGE-ME') {
      throw new Error('Production requires JWT_SECRET');
    }
    if (!config.llm.apiKey) throw new Error('Production requires API_KEY');
  }
}
