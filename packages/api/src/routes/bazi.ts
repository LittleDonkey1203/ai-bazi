import express, { type Router as RouterType } from 'express';
const { Router } = express;
import { z } from 'zod';
import { getBaziChart } from '../services/baziService.js';
import { validateBody } from '../middleware/validate.js';
import { chartRateLimit } from '../middleware/rateLimit.js';

const router: RouterType = Router();

const BaziInputSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59).optional(),
  gender: z.enum(['male', 'female']),
});

router.post('/chart',
  chartRateLimit,
  validateBody(BaziInputSchema),
  async (req, res, next) => {
    try {
      const chart = await getBaziChart(req.body);
      res.json(chart);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
