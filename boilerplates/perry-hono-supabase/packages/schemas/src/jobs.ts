import { z } from 'zod';

export const jobStatus = z.enum([
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
]);
export type JobStatus = z.infer<typeof jobStatus>;

export const job = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  deviceId: z.string().uuid().nullable(),
  type: z.string(),
  status: jobStatus,
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()).nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Job = z.infer<typeof job>;

export const jobCreateInput = z.object({
  type: z.string().min(1).max(120),
  input: z.record(z.string(), z.unknown()).default({}),
});
export type JobCreateInput = z.infer<typeof jobCreateInput>;

export const jobCompleteInput = z.object({
  output: z.record(z.string(), z.unknown()).default({}),
});
export type JobCompleteInput = z.infer<typeof jobCompleteInput>;

export const jobFailInput = z.object({
  error: z.string().min(1),
});
export type JobFailInput = z.infer<typeof jobFailInput>;
