import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import {
  INSTALL_STATE_COOKIE,
  githubFetch,
  loadGithubAppConfig,
  mintAppJwt,
} from '@/lib/github-app';

interface GithubInstallation {
  id: number;
  account: { login: string; type: 'User' | 'Organization'; avatar_url?: string };
  repository_selection: 'all' | 'selected';
  permissions: Record<string, string>;
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const next = encodeURIComponent('/dashboard/connect/github');
    return NextResponse.redirect(new URL(`/login?next=${next}`, req.url));
  }

  const params = req.nextUrl.searchParams;
  const installationIdRaw = params.get('installation_id');
  const setupAction = params.get('setup_action');
  const returnedState = params.get('state');

  if (!installationIdRaw || !/^\d+$/.test(installationIdRaw)) {
    return NextResponse.redirect(new URL('/dashboard/github?error=missing_installation', req.url));
  }
  const installationId = Number.parseInt(installationIdRaw, 10);

  // CSRF: the state cookie was set when we redirected to GitHub. It must
  // match what GitHub echoes back. Missing cookie = treat as untrusted.
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(INSTALL_STATE_COOKIE)?.value;
  cookieStore.delete(INSTALL_STATE_COOKIE);
  if (!expectedState || !returnedState || expectedState !== returnedState) {
    return NextResponse.redirect(new URL('/dashboard/github?error=bad_state', req.url));
  }

  const config = await loadGithubAppConfig();
  if (!config || !config.app_id || !config.private_key_pem) {
    return NextResponse.redirect(new URL('/dashboard/github?error=app_not_configured', req.url));
  }

  // Look up the installation details so we can record account_login etc.
  const jwt = mintAppJwt(config.app_id, config.private_key_pem);
  const lookup = await githubFetch<GithubInstallation>(`/app/installations/${installationId}`, {
    token: jwt,
    tokenType: 'app-jwt',
  });
  if (!lookup.ok || !lookup.data) {
    console.error('[gh-callback] installation lookup failed', lookup);
    return NextResponse.redirect(new URL('/dashboard/github?error=lookup_failed', req.url));
  }

  const inst = lookup.data;

  const admin = getSupabaseServiceClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle<{ id: string }>();
  if (!profile) {
    return NextResponse.redirect(new URL('/dashboard?error=no_profile', req.url));
  }

  const now = new Date().toISOString();
  const { error: upsertErr } = await admin
    .from('github_installations')
    .upsert(
      {
        profile_id: profile.id,
        installation_id: installationId,
        account_login: inst.account.login,
        account_type: inst.account.type,
        account_avatar_url: inst.account.avatar_url ?? null,
        repository_selection: inst.repository_selection,
        permissions: inst.permissions,
        status: setupAction === 'install' || setupAction === 'update' ? 'active' : 'active',
        updated_at: now,
      },
      { onConflict: 'profile_id,installation_id' },
    );
  if (upsertErr) {
    console.error('[gh-callback] upsert failed', upsertErr);
    return NextResponse.redirect(new URL('/dashboard/github?error=persist_failed', req.url));
  }

  return NextResponse.redirect(new URL('/dashboard/github?installed=1', req.url));
}
