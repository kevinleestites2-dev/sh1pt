import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type DbClient = SupabaseClient;

/**
 * Privileged service-role client. Server-only. Never ship to the browser.
 */
export function createServiceClient(env: {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}): DbClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * User-scoped client driven by the caller's access token.
 * Use this in API request handlers to enforce RLS.
 */
export function createUserClient(env: {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  accessToken: string;
}): DbClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${env.accessToken}` } },
  });
}
