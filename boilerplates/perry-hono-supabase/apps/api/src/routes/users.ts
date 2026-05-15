import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { profileUpdateInput } from '@sh1pt/schemas';
import { users } from '@sh1pt/db';
import { NotFoundError } from '@sh1pt/core';
import type { AppBindings } from '../types.ts';
import { requireAuth } from '../middleware/auth.ts';

export const userRoutes = new Hono<AppBindings>();

userRoutes.use('/me', requireAuth);
userRoutes.use('/me/*', requireAuth);

userRoutes.get('/me', async (c) => {
  const { user, db } = c.var;
  const profile = await users.getProfile(db, user.id);
  if (!profile) throw new NotFoundError('profile');
  return c.json(profile);
});

userRoutes.patch('/me', zValidator('json', profileUpdateInput), async (c) => {
  const { user, db } = c.var;
  const patch = c.req.valid('json');
  const updated = await users.upsertProfile(db, {
    id: user.id,
    email: user.email,
    display_name: patch.displayName ?? null,
  });
  return c.json(updated);
});
