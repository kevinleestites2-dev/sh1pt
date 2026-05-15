import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  jobCreateInput,
  jobCompleteInput,
  jobFailInput,
  heartbeatInput,
} from '@sh1pt/schemas';
import { jobs as jobsDb, devices as devicesDb } from '@sh1pt/db';
import { NotFoundError, jobs as jobsCore, devices as devicesCore } from '@sh1pt/core';
import type { AppBindings } from '../types.ts';
import { requireAuth } from '../middleware/auth.ts';

export const jobRoutes = new Hono<AppBindings>();

jobRoutes.use('/jobs', requireAuth);
jobRoutes.use('/jobs/*', requireAuth);
jobRoutes.use('/worker/*', requireAuth);

jobRoutes.get('/jobs', async (c) => {
  const { user, db } = c.var;
  return c.json(await jobsDb.listJobs(db, user.id));
});

jobRoutes.get('/jobs/:id', async (c) => {
  const { db } = c.var;
  const job = await jobsDb.getJob(db, c.req.param('id'));
  if (!job) throw new NotFoundError('job');
  return c.json(job);
});

jobRoutes.post('/jobs', zValidator('json', jobCreateInput), async (c) => {
  const { user, db } = c.var;
  const input = c.req.valid('json');
  const job = await jobsDb.createJob(db, {
    userId: user.id,
    type: input.type,
    input: input.input,
  });
  return c.json(job, 201);
});

jobRoutes.post('/jobs/:id/cancel', async (c) => {
  const { db } = c.var;
  const id = c.req.param('id');
  const existing = await jobsDb.getJob(db, id);
  if (!existing) throw new NotFoundError('job');
  jobsCore.assertCancellable({ status: existing.status });
  const cancelled = await jobsDb.cancelJob(db, id);
  return c.json(cancelled);
});

// --- Worker endpoints ---
// These assume the calling worker has registered as a device and uses the
// owning user's access token. Future: per-device API keys.

jobRoutes.post(
  '/worker/heartbeat',
  zValidator('json', heartbeatInput),
  async (c) => {
    const { user, db } = c.var;
    const input = c.req.valid('json');
    const deviceIdHeader = c.req.header('x-device-id');
    if (!deviceIdHeader) {
      return c.json({ error: 'missing x-device-id header', code: 'missing_device' }, 400);
    }
    const device = await devicesDb.getDevice(db, deviceIdHeader);
    if (!device) throw new NotFoundError('device');
    devicesCore.assertDeviceOwner({ userId: device.user_id }, user.id);
    await devicesDb.recordHeartbeat(db, {
      deviceId: deviceIdHeader,
      capabilities: input.capabilities,
    });
    return c.json({ ok: true });
  },
);

jobRoutes.get('/worker/jobs/next', async (c) => {
  const { db } = c.var;
  const deviceIdHeader = c.req.header('x-device-id');
  if (!deviceIdHeader) {
    return c.json({ error: 'missing x-device-id header', code: 'missing_device' }, 400);
  }
  const next = await jobsDb.claimNextJob(db, deviceIdHeader);
  return c.json(next ?? null);
});

jobRoutes.post(
  '/worker/jobs/:id/complete',
  zValidator('json', jobCompleteInput),
  async (c) => {
    const { db } = c.var;
    const id = c.req.param('id');
    const existing = await jobsDb.getJob(db, id);
    if (!existing) throw new NotFoundError('job');
    jobsCore.assertCanComplete({ status: existing.status });
    const out = c.req.valid('json');
    return c.json(await jobsDb.completeJob(db, id, out.output));
  },
);

jobRoutes.post(
  '/worker/jobs/:id/fail',
  zValidator('json', jobFailInput),
  async (c) => {
    const { db } = c.var;
    const id = c.req.param('id');
    const existing = await jobsDb.getJob(db, id);
    if (!existing) throw new NotFoundError('job');
    const { error: errMsg } = c.req.valid('json');
    return c.json(await jobsDb.failJob(db, id, errMsg));
  },
);
