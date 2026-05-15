import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { loginInput, refreshInput } from '@sh1pt/schemas';
import { createServiceClient } from '@sh1pt/db';
import { UnauthorizedError } from '@sh1pt/core';
import type { AppBindings } from '../types.ts';
import { env } from '../env.ts';

export const authRoutes = new Hono<AppBindings>();

authRoutes.post('/auth/login', zValidator('json', loginInput), async (c) => {
  const { email, password } = c.req.valid('json');
  const sb = createServiceClient({
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new UnauthorizedError(error?.message ?? 'login failed');
  return c.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at ?? 0,
  });
});

authRoutes.post('/auth/refresh', zValidator('json', refreshInput), async (c) => {
  const { refreshToken } = c.req.valid('json');
  const sb = createServiceClient({
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  });
  const { data, error } = await sb.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) throw new UnauthorizedError(error?.message ?? 'refresh failed');
  return c.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at ?? 0,
  });
});

authRoutes.post('/auth/logout', async (c) => {
  // Stateless JWT — clients drop the tokens. With session storage we'd revoke here.
  return c.body(null, 204);
});
