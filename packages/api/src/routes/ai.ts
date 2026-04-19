import express, { type Router as RouterType } from 'express';
import { z } from 'zod';
import {
  createGeminiProvider,
  SYSTEM_PROMPT,
  buildInterpretationUserMessage,
  type ChatMessage,
} from '@bazi/ai-service';
import { getBaziChart } from '../services/baziService.js';
import { validateBody } from '../middleware/validate.js';
import { chatRateLimit } from '../middleware/rateLimit.js';
import { config } from '../config.js';

const { Router } = express;
const router: RouterType = Router();

const ChatSchema = z.object({
  input: z.object({
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59).optional(),
    gender: z.enum(['male', 'female']),
  }),
  message: z.string().max(2000).default(''),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(8000),
  })).max(40).default([]),
});

router.post('/chat',
  chatRateLimit,
  validateBody(ChatSchema),
  async (req, res) => {
    if (!config.llm.apiKey) {
      res.status(500).json({ error: 'Server missing API_KEY' });
      return;
    }

    const { input, message, history } = req.body as z.infer<typeof ChatSchema>;
    const chart = await getBaziChart(input);

    const messages: ChatMessage[] = history.length === 0
      ? [{ role: 'user', content: buildInterpretationUserMessage(chart, message || undefined) }]
      : [...history, { role: 'user', content: message }];

    const provider = createGeminiProvider({
      apiBase: config.llm.apiBase,
      apiKey: config.llm.apiKey,
      model: config.llm.model,
      timeoutMs: 180_000,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      for await (const delta of provider.chatStream({
        systemPrompt: SYSTEM_PROMPT,
        messages,
        temperature: 0.6,
        stream: true,
      })) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    } finally {
      res.end();
    }
  },
);

export default router;
