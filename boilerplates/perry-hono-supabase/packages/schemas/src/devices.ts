import { z } from 'zod';

export const deviceKind = z.enum([
  'web',
  'mobile',
  'desktop',
  'cli',
  'worker',
  'agent',
  'integration',
]);
export type DeviceKind = z.infer<typeof deviceKind>;

export const device = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  kind: deviceKind,
  platform: z.string().nullable(),
  clientVersion: z.string().nullable(),
  publicKey: z.string().nullable(),
  lastSeenAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Device = z.infer<typeof device>;

export const deviceRegisterInput = z.object({
  name: z.string().min(1).max(120),
  kind: deviceKind,
  platform: z.string().optional(),
  clientVersion: z.string().optional(),
  publicKey: z.string().optional(),
});
export type DeviceRegisterInput = z.infer<typeof deviceRegisterInput>;

export const heartbeatInput = z.object({
  capabilities: z.record(z.string(), z.unknown()).default({}),
});
export type HeartbeatInput = z.infer<typeof heartbeatInput>;
