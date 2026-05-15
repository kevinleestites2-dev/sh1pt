import { Hono } from 'hono';
import type { AppBindings } from './types.ts';
import { corsMiddleware } from './middleware/cors.ts';
import { errorHandler } from './middleware/error.ts';
import { healthRoutes } from './routes/health.ts';
import { authRoutes } from './routes/auth.ts';
import { userRoutes } from './routes/users.ts';
import { deviceRoutes } from './routes/devices.ts';
import { jobRoutes } from './routes/jobs.ts';
import { env } from './env.ts';

export function createApp(): Hono<AppBindings> {
  const app = new Hono<AppBindings>();

  app.use('*', corsMiddleware(env.WEB_URL));
  app.onError(errorHandler);

  app.route('/', healthRoutes);
  app.route('/', authRoutes);
  app.route('/', userRoutes);
  app.route('/', deviceRoutes);
  app.route('/', jobRoutes);

  return app;
}
