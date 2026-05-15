import { Hono } from 'hono';
import type { AppBindings } from '../types.ts';

export const healthRoutes = new Hono<AppBindings>();

healthRoutes.get('/health', (c) => c.json({ ok: true }));
healthRoutes.get('/version', (c) =>
  c.json({ name: 'sh1pt-api', version: '0.1.0' }),
);
