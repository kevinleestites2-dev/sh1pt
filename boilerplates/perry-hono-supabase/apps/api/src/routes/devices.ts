import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { deviceRegisterInput } from '@sh1pt/schemas';
import { devices as devicesDb } from '@sh1pt/db';
import { NotFoundError, devices as devicesCore } from '@sh1pt/core';
import type { AppBindings } from '../types.ts';
import { requireAuth } from '../middleware/auth.ts';

export const deviceRoutes = new Hono<AppBindings>();

deviceRoutes.use('/devices', requireAuth);
deviceRoutes.use('/devices/*', requireAuth);

deviceRoutes.get('/devices', async (c) => {
  const { user, db } = c.var;
  return c.json(await devicesDb.listDevices(db, user.id));
});

deviceRoutes.get('/devices/:id', async (c) => {
  const { user, db } = c.var;
  const id = c.req.param('id');
  const device = await devicesDb.getDevice(db, id);
  if (!device) throw new NotFoundError('device');
  devicesCore.assertDeviceOwner({ userId: device.user_id }, user.id);
  return c.json(device);
});

deviceRoutes.post(
  '/devices/register',
  zValidator('json', deviceRegisterInput),
  async (c) => {
    const { user, db } = c.var;
    const input = c.req.valid('json');
    const created = await devicesDb.registerDevice(db, {
      userId: user.id,
      name: input.name,
      kind: input.kind,
      platform: input.platform,
      clientVersion: input.clientVersion,
      publicKey: input.publicKey,
    });
    return c.json(created, 201);
  },
);

deviceRoutes.delete('/devices/:id', async (c) => {
  const { user, db } = c.var;
  const id = c.req.param('id');
  const device = await devicesDb.getDevice(db, id);
  if (!device) throw new NotFoundError('device');
  devicesCore.assertDeviceOwner({ userId: device.user_id }, user.id);
  await devicesDb.deleteDevice(db, id);
  return c.body(null, 204);
});
