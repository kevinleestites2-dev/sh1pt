import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-guard';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { loadGithubAppConfig, summarizeConfig } from '@/lib/github-app';

export async function GET(_req: NextRequest) {
  const guard = await requireAdminApi();
  if (guard instanceof NextResponse) return guard;

  const row = await loadGithubAppConfig();
  return NextResponse.json({ config: summarizeConfig(row) });
}

interface PostBody {
  app_id?: number | string | null;
  app_slug?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
  private_key_pem?: string | null;
  webhook_secret?: string | null;
}

function parseAppId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return undefined;
}

function trimmedOrNull(value: unknown): string | null | undefined {
  if (value === undefined) return undefined; // leave existing
  if (value === null) return null; // explicit clear
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed; // empty string ≡ "no change"
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi();
  if (guard instanceof NextResponse) return guard;

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const existing = await loadGithubAppConfig();

  const patch: Record<string, unknown> = { updated_by: guard.profileId, updated_at: new Date().toISOString() };

  const appId = parseAppId(body.app_id);
  if (appId !== undefined) patch.app_id = appId;

  const slug = trimmedOrNull(body.app_slug);
  if (slug !== undefined) patch.app_slug = slug;

  const clientId = trimmedOrNull(body.client_id);
  if (clientId !== undefined) patch.client_id = clientId;

  const clientSecret = trimmedOrNull(body.client_secret);
  if (clientSecret !== undefined) patch.client_secret = clientSecret;

  const privateKey = trimmedOrNull(body.private_key_pem);
  if (privateKey !== undefined) {
    if (privateKey && !/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(privateKey)) {
      return NextResponse.json(
        { error: 'private_key_pem must be a PEM-encoded RSA key' },
        { status: 400 },
      );
    }
    patch.private_key_pem = privateKey;
  }

  const webhookSecret = trimmedOrNull(body.webhook_secret);
  if (webhookSecret !== undefined) patch.webhook_secret = webhookSecret;

  // Any change resets the verified_at — the admin should re-verify.
  patch.verified_at = null;

  if (existing) {
    const { error } = await supabase
      .from('github_app_config')
      .update(patch)
      .eq('id', existing.id);
    if (error) {
      console.error('[admin] github_app_config update failed', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from('github_app_config')
      .insert({ ...patch, created_at: new Date().toISOString() });
    if (error) {
      console.error('[admin] github_app_config insert failed', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const fresh = await loadGithubAppConfig();
  return NextResponse.json({ config: summarizeConfig(fresh) });
}
