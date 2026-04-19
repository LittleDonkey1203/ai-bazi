import express, { type Router as RouterType } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getPrisma } from '../db/prisma.js';
import { signToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const { Router } = express;
const router: RouterType = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  displayName: z.string().max(50).optional(),
});
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', validateBody(RegisterSchema), async (req, res) => {
  const { email, password, displayName } = req.body as z.infer<typeof RegisterSchema>;
  const prisma = getPrisma();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.status(409).json({ error: 'EmailAlreadyUsed' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName },
  });
  const token = signToken({ id: user.id, email: user.email });
  res.status(201).json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
});

router.post('/login', validateBody(LoginSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof LoginSchema>;
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'InvalidCredentials' });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: 'InvalidCredentials' });
    return;
  }
  const token = signToken({ id: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
});

export default router;
