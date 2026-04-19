import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/** 通用 zod body 校验中间件 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const r = schema.safeParse(req.body);
    if (!r.success) {
      res.status(400).json({
        error: 'ValidationError',
        issues: r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
      return;
    }
    req.body = r.data;
    next();
  };
}
