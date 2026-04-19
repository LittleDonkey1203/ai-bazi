import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import baziRouter from './routes/bazi.js';
import aiRouter from './routes/ai.js';
import authRouter from './routes/auth.js';
import healthRouter from './routes/health.js';

export function buildApp(): express.Express {
  const app = express();
  app.use(helmet({
    contentSecurityPolicy: false, // SSE requires some flexibility
  }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '256kb' }));
  app.use(pinoHttp({
    level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
    customLogLevel: (_req, res, err) => {
      if (err || (res.statusCode ?? 500) >= 500) return 'error';
      if ((res.statusCode ?? 0) >= 400) return 'warn';
      return 'info';
    },
  }));

  app.use('/api/health', healthRouter);
  app.use('/api/bazi', baziRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/auth', authRouter);

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: 'NotFound', path: req.path });
  });

  // 错误处理 — 捕获 next(err)
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[api] error:', err);
    if (res.headersSent) return;
    res.status(500).json({ error: 'InternalServerError', message: err.message });
  });

  return app;
}
