import { cors } from 'hono/cors';

export function corsMiddleware(allowedOrigin: string) {
  return cors({
    origin: allowedOrigin,
    credentials: true,
    allowHeaders: ['authorization', 'content-type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
}
