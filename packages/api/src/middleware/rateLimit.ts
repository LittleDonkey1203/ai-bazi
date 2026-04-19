import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

export const chartRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.chartMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RateLimited', message: '请求过于频繁,请稍后再试' },
});

export const chatRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.chatMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RateLimited', message: 'AI 对话请求过于频繁' },
});
