import { z } from 'zod';

export const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof loginInput>;

export const refreshInput = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshInput>;

export const session = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number().int().positive(),
});
export type Session = z.infer<typeof session>;

export const apiKeyCreateInput = z.object({
  name: z.string().min(1).max(120),
  scopes: z.array(z.string()).default([]),
});
export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateInput>;
