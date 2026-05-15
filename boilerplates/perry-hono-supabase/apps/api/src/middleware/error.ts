import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { DomainError } from '@sh1pt/core';
import { ZodError } from 'zod';

export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof HTTPException) {
    return c.json(
      { error: err.message || 'http_error', code: 'http_error' },
      err.status,
    );
  }
  if (err instanceof DomainError) {
    return c.json({ error: err.message, code: err.code }, err.status as 400);
  }
  if (err instanceof ZodError) {
    return c.json(
      { error: 'validation_failed', code: 'validation_failed', details: err.flatten() },
      422,
    );
  }
  console.error('[api] unhandled', err);
  return c.json({ error: 'internal_error', code: 'internal_error' }, 500);
}
