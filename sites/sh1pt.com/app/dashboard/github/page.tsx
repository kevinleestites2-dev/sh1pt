import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

export const metadata = {
  title: 'GitHub installations — sh1pt',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface Installation {
  id: string;
  installation_id: number;
  account_login: string;
  account_type: 'User' | 'Organization';
  account_avatar_url: string | null;
  repository_selection: 'all' | 'selected';
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_installation: 'GitHub did not return an installation_id. Try again.',
  bad_state: 'CSRF check failed. Start the install flow from the Connect button.',
  app_not_configured: 'sh1pt GitHub App is not configured. Ask an admin to set it up.',
  lookup_failed: 'Could not load the installation from GitHub. Try again.',
  persist_failed: 'Could not save the installation. Try again.',
  no_profile: 'No profile found for your account.',
};

export default async function GithubInstallationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/github');

  const admin = getSupabaseServiceClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle<{ id: string }>();
  if (!profile) redirect('/dashboard?error=no_profile');

  const { data: rows } = await admin
    .from('github_installations')
    .select(
      'id, installation_id, account_login, account_type, account_avatar_url, repository_selection, status, created_at, updated_at',
    )
    .eq('profile_id', profile.id)
    .order('updated_at', { ascending: false });

  const installations = (rows ?? []) as Installation[];

  const params = await searchParams;
  const installed = params.installed === '1';
  const errorKey = typeof params.error === 'string' ? params.error : null;
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] ?? `Error: ${errorKey}` : null;

  return (
    <main className="container" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 760 }}>
      <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', margin: 0 }}>GitHub installations</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        Orgs and users where you've installed the sh1pt Actions Fleet app.
      </p>

      {installed && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: '1px solid rgba(74,222,128,0.4)',
            background: 'rgba(74,222,128,0.08)',
            borderRadius: 8,
            fontSize: '0.9rem',
          }}
        >
          ✓ Installation saved. Pick repos below.
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: '1px solid rgba(248,113,113,0.4)',
            background: 'rgba(248,113,113,0.08)',
            borderRadius: 8,
            fontSize: '0.9rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Link href="/dashboard/connect/github" className="btn">
          + Add a GitHub installation
        </Link>
      </div>

      {installations.length === 0 ? (
        <p className="muted" style={{ marginTop: 24 }}>
          No installations yet. Click <strong>Add a GitHub installation</strong> to get started.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 24, display: 'grid', gap: 12 }}>
          {installations.map((inst) => (
            <li
              key={inst.id}
              style={{
                padding: 16,
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
                borderRadius: 10,
                background: 'rgba(0,0,0,0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                {inst.account_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inst.account_avatar_url}
                    alt=""
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%', display: 'block' }}
                  />
                ) : null}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <strong>{inst.account_login}</strong>
                    <span className="muted" style={{ fontSize: '0.8rem' }}>
                      {inst.account_type === 'Organization' ? 'org' : 'user'} ·{' '}
                      {inst.repository_selection === 'all' ? 'all repos' : 'selected repos'}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>
                    Installation #{inst.installation_id} · status {inst.status}
                  </div>
                </div>
              </div>
              <Link
                href={`/dashboard/github/repos?installation=${inst.id}`}
                className="btn secondary"
                style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                Pick repos →
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: 32, fontSize: '0.85rem' }}>
        <Link href="/dashboard" className="muted">
          ← Back to dashboard
        </Link>
      </p>
    </main>
  );
}
