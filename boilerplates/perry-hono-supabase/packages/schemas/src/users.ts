import { z } from 'zod';

export const profile = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Profile = z.infer<typeof profile>;

export const profileUpdateInput = z.object({
  displayName: z.string().min(1).max(120).optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateInput>;
