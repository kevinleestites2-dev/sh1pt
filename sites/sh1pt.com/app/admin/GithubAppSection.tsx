'use client';

import { useCallback, useEffect, useState } from 'react';

type ConfigSummary = {
  configured: boolean;
  app_id: number | null;
  app_slug: string | null;
  client_id: string | null;
  private_key_pem_set: boolean;
  webhook_secret_set: boolean;
  client_secret_set: boolean;
  verified_at: string | null;
  updated_at: string | null;
};

type VerifyResponse = {
  ok: boolean;
  app?: { id: number; slug: string; name: string; owner: { login: string; type: string } };
  error?: string;
  verified_at?: string;
};

const SECTION_STYLE: React.CSSProperties = {
  marginTop: 24,
  padding: 20,
  border: '1px solid var(--border, rgba(255,255,255,0.1))',
  borderRadius: 12,
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid var(--border, rgba(255,255,255,0.1))',
  borderRadius: 6,
  color: 'inherit',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
};

const SECRET_PLACEHOLDER = '••••••• (saved — leave blank to keep current)';

export default function GithubAppSection() {
  const [config, setConfig] = useState<ConfigSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [appId, setAppId] = useState('');
  const [appSlug, setAppSlug] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  // Callback + webhook URLs are derived from the running host so the values
  // stay correct in preview / staging / prod.
  const [origin, setOrigin] = useState('https://sh1pt.com');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const callbackUrl = `${origin}/api/github/installations/callback`;
  const webhookUrl = `${origin}/api/webhooks/github`;
  const setupUrl = `${origin}/dashboard/connect/github`;

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/github-app', { credentials: 'include' });
      if (!res.ok) {
        setError(res.status === 403 ? 'Forbidden' : 'Failed to load GitHub App config');
        return;
      }
      const data = (await res.json()) as { config: ConfigSummary };
      setConfig(data.config);
      setAppId(data.config.app_id != null ? String(data.config.app_id) : '');
      setAppSlug(data.config.app_slug ?? '');
      setClientId(data.config.client_id ?? '');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setVerifyResult(null);
    try {
      const body: Record<string, unknown> = {};
      if (appId.trim()) body.app_id = appId.trim();
      if (appSlug.trim()) body.app_slug = appSlug.trim();
      if (clientId.trim()) body.client_id = clientId.trim();
      if (clientSecret.trim()) body.client_secret = clientSecret.trim();
      if (privateKey.trim()) body.private_key_pem = privateKey.trim();
      if (webhookSecret.trim()) body.webhook_secret = webhookSecret.trim();
      const res = await fetch('/api/admin/github-app', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || 'Save failed');
        return;
      }
      const data = (await res.json()) as { config: ConfigSummary };
      setConfig(data.config);
      setClientSecret('');
      setPrivateKey('');
      setWebhookSecret('');
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/github-app/verify', {
        method: 'POST',
        credentials: 'include',
      });
      const data = (await res.json()) as VerifyResponse;
      setVerifyResult(data);
      if (data.ok) void fetchConfig();
    } catch {
      setError('Network error during verify');
    } finally {
      setVerifying(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  return (
    <section style={SECTION_STYLE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>GitHub App — Actions Fleet</h2>
          <p className="muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
            Platform-level credentials for the sh1pt Actions Fleet GitHub App. Users install this
            app on their orgs from <code>/dashboard/connect/github</code>.
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
          <div style={{ color: config?.configured ? '#4ade80' : 'rgba(255,255,255,0.5)' }}>
            {config?.configured ? '● Configured' : '○ Not configured'}
          </div>
          {config?.verified_at ? (
            <div style={{ color: '#4ade80' }}>
              ✓ Verified {new Date(config.verified_at).toLocaleString()}
            </div>
          ) : null}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: '1px solid rgba(248,113,113,0.4)',
            background: 'rgba(248,113,113,0.08)',
            borderRadius: 8,
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
          Step 1 — Create the GitHub App on github.com
        </summary>
        <ol style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.6 }}>
          <li>
            Visit{' '}
            <a
              href="https://github.com/settings/apps/new"
              target="_blank"
              rel="noreferrer"
            >
              github.com/settings/apps/new
            </a>{' '}
            (or your org's <code>Settings → Developer settings → GitHub Apps</code>).
          </li>
          <li>
            Name: <code>sh1pt Actions Fleet</code> · Homepage URL: <code>{origin}</code>
          </li>
          <li>
            Callback URL (User authorization): paste{' '}
            <button
              onClick={() => copy(callbackUrl)}
              className="muted"
              style={{ background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              📋
            </button>
            <code style={{ fontSize: '0.8rem' }}>{callbackUrl}</code>
          </li>
          <li>
            Setup URL (post-install redirect, optional): paste{' '}
            <button
              onClick={() => copy(setupUrl)}
              className="muted"
              style={{ background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              📋
            </button>
            <code style={{ fontSize: '0.8rem' }}>{setupUrl}</code>
          </li>
          <li>
            Webhook URL: paste{' '}
            <button
              onClick={() => copy(webhookUrl)}
              className="muted"
              style={{ background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              📋
            </button>
            <code style={{ fontSize: '0.8rem' }}>{webhookUrl}</code>
            . Generate a random Webhook secret — paste it below.
          </li>
          <li>
            Permissions:
            <ul>
              <li>Repository → Contents: <strong>Read &amp; write</strong></li>
              <li>Repository → Pull requests: <strong>Read &amp; write</strong></li>
              <li>Repository → Metadata: <strong>Read</strong> (auto)</li>
              <li>Repository → Actions: <strong>Read</strong></li>
            </ul>
          </li>
          <li>Subscribe to events: <code>installation</code>, <code>installation_repositories</code></li>
          <li>Where can this app be installed: <strong>Any account</strong></li>
          <li>
            After creating: download the private key (<code>.pem</code>) and copy the App ID and
            (optional) Client ID + Client secret from the same page.
          </li>
        </ol>
      </details>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
          App ID
          <input
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="1234567"
            style={INPUT_STYLE}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
          App slug
          <input
            type="text"
            value={appSlug}
            onChange={(e) => setAppSlug(e.target.value)}
            placeholder="sh1pt-actions-fleet"
            style={INPUT_STYLE}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
          Client ID
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Iv1.abcdef..."
            style={INPUT_STYLE}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
          Client secret
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={config?.client_secret_set ? SECRET_PLACEHOLDER : ''}
            style={INPUT_STYLE}
          />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', marginTop: 12 }}>
        Webhook secret
        <input
          type="password"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
          placeholder={config?.webhook_secret_set ? SECRET_PLACEHOLDER : ''}
          style={INPUT_STYLE}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', marginTop: 12 }}>
        Private key (PEM)
        <textarea
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          placeholder={
            config?.private_key_pem_set
              ? SECRET_PLACEHOLDER
              : '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----'
          }
          rows={8}
          style={{ ...INPUT_STYLE, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: '0.75rem' }}
        />
      </label>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button className="btn" onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Saving…' : config?.configured ? 'Save changes' : 'Save'}
        </button>
        <button
          className="btn secondary"
          onClick={handleVerify}
          disabled={verifying || !config?.configured}
        >
          {verifying ? 'Verifying…' : 'Verify connection'}
        </button>
        <button className="btn secondary" onClick={fetchConfig} disabled={loading} style={{ fontSize: '0.85rem' }}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {verifyResult && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: `1px solid ${verifyResult.ok ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)'}`,
            background: verifyResult.ok ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
            borderRadius: 8,
            fontSize: '0.85rem',
          }}
        >
          {verifyResult.ok && verifyResult.app ? (
            <>
              ✓ Verified as <strong>{verifyResult.app.name}</strong> (
              <code>{verifyResult.app.slug}</code>, id <code>{verifyResult.app.id}</code>) owned by{' '}
              <code>
                {verifyResult.app.owner.login} · {verifyResult.app.owner.type}
              </code>
              .
            </>
          ) : (
            <>✗ {verifyResult.error ?? 'Verification failed'}</>
          )}
        </div>
      )}
    </section>
  );
}
