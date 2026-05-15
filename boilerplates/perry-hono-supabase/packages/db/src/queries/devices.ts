import type { DbClient } from '../supabase.ts';
import type { DeviceKind } from '@sh1pt/schemas';

export async function listDevices(db: DbClient, userId: string) {
  const { data, error } = await db
    .from('devices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDevice(db: DbClient, id: string) {
  const { data, error } = await db
    .from('devices')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function registerDevice(
  db: DbClient,
  input: {
    userId: string;
    name: string;
    kind: DeviceKind;
    platform?: string;
    clientVersion?: string;
    publicKey?: string;
  },
) {
  const { data, error } = await db
    .from('devices')
    .insert({
      user_id: input.userId,
      name: input.name,
      kind: input.kind,
      platform: input.platform ?? null,
      client_version: input.clientVersion ?? null,
      public_key: input.publicKey ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDevice(db: DbClient, id: string) {
  const { error } = await db.from('devices').delete().eq('id', id);
  if (error) throw error;
}

export async function recordHeartbeat(
  db: DbClient,
  input: { deviceId: string; capabilities: Record<string, unknown> },
) {
  const now = new Date().toISOString();
  const [{ error: hbError }, { error: devError }] = await Promise.all([
    db.from('worker_heartbeats').insert({
      device_id: input.deviceId,
      capabilities: input.capabilities,
    }),
    db.from('devices').update({ last_seen_at: now }).eq('id', input.deviceId),
  ]);
  if (hbError) throw hbError;
  if (devError) throw devError;
}
