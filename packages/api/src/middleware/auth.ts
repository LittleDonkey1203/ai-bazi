import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthUser {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** 强鉴权:无 token 或无效 → 401 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = extractUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = user;
  next();
}

/** 弱鉴权:有 token 则附 user,无则放行 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const user = extractUser(req);
  if (user) req.user = user;
  next();
}

function extractUser(req: Request): AuthUser | null {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthUser & { iat: number; exp: number };
    return { id: payload.id, email: payload.email };
  } catch {
    return null;
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}
