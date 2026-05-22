import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-guard';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { loadGithubAppConfig, verifyAppCredentials } from '@/lib/github-app';

export async function POST(_req: NextRequest) {
  const guard = await requireAdminApi();
  if (guard instanceof NextResponse) return guard;

  const config = await loadGithubAppConfig();
  if (!config || !config.app_id || !config.private_key_pem) {
    return NextResponse.json(
      { ok: false, error: 'Set app_id and private_key_pem first.' },
      { status: 400 },
    );
  }

  const result = await verifyAppCredentials(config.app_id, config.private_key_pem);
  if (!result.ok || !result.data) {
    return NextResponse.json(
      { ok: false, status: result.status, error: result.error ?? 'Verification failed' },
      { status: 400 },
    );
  }

  const slug = result.data.slug;
  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();
  await supabase
    .from('github_app_config')
    .update({ verified_at: now, app_slug: slug, updated_at: now, updated_by: guard.profileId })
    .eq('id', config.id);

  return NextResponse.json({
    ok: true,
    app: {
      id: result.data.id,
      slug: result.data.slug,
      name: result.data.name,
      owner: result.data.owner,
      permissions: result.data.permissions,
      events: result.data.events,
    },
    verified_at: now,
  });
}
