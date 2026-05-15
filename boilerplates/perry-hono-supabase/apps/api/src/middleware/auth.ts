import type { MiddlewareHandler } from 'hono';
import { createServiceClient, createUserClient } from '@sh1pt/db';
import { UnauthorizedError } from '@sh1pt/core';
import type { AppBindings } from '../types.ts';
import { env } from '../env.ts';

export const requireAuth: MiddlewareHandler<AppBindings> = async (c, next) => {
  const header = c.req.header('authorization');
  if (!header?.toLowerCase().startsWith('bearer ')) {
    throw new UnauthorizedError('missing bearer token');
  }
  const token = header.slice(7).trim();

  // Validate the JWT against Supabase using a service client.
  // (For RLS-bound queries, use c.var.db which is scoped to this token.)
  const service = createServiceClient({
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  });
  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user) throw new UnauthorizedError('invalid token');

  c.set('user', { id: data.user.id, email: data.user.email ?? null });
  c.set('accessToken', token);
  c.set(
    'db',
    createUserClient({
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
      accessToken: token,
    }),
  );
  await next();
};
