import type { DbClient } from '../supabase.ts';

export async function listJobs(db: DbClient, userId: string) {
  const { data, error } = await db
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getJob(db: DbClient, id: string) {
  const { data, error } = await db
    .from('jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createJob(
  db: DbClient,
  input: { userId: string; type: string; input: Record<string, unknown> },
) {
  const { data, error } = await db
    .from('jobs')
    .insert({
      user_id: input.userId,
      type: input.type,
      input: input.input,
      status: 'queued',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function claimNextJob(db: DbClient, deviceId: string) {
  // Atomic-ish claim using update + filter. For real concurrency
  // protection, swap to a SQL function / SKIP LOCKED query.
  const { data, error } = await db.rpc('claim_next_job', {
    p_device_id: deviceId,
  });
  if (error) throw error;
  return data;
}

export async function completeJob(
  db: DbClient,
  id: string,
  output: Record<string, unknown>,
) {
  const { data, error } = await db
    .from('jobs')
    .update({ status: 'succeeded', output, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function failJob(db: DbClient, id: string, err: string) {
  const { data, error } = await db
    .from('jobs')
    .update({ status: 'failed', error: err, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelJob(db: DbClient, id: string) {
  const { data, error } = await db
    .from('jobs')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .in('status', ['queued', 'running'])
    .select()
    .single();
  if (error) throw error;
  return data;
}
