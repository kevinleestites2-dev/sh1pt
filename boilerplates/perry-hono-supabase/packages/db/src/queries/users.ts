import type { DbClient } from '../supabase.ts';

export async function getProfile(db: DbClient, userId: string) {
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(
  db: DbClient,
  profile: { id: string; email?: string | null; display_name?: string | null },
) {
  const { data, error } = await db
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
