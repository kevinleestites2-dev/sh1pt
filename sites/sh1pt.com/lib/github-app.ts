import 'server-only';
import { createPrivateKey, createSign, randomUUID } from 'node:crypto';
import { getSupabaseServiceClient } from './supabase/service';

// sh1pt platform-level GitHub App helpers.
//
// Two tokens are in play:
//  - App JWT: signed with the App's private key (RS256), valid 10 minutes.
//    Used for app-level endpoints like GET /app and minting installation tokens.
//  - Installation token: short-lived (~1h), minted per installation, used for
//    repo-level reads/writes (contents, pull-requests, etc.).
//
// We NEVER persist installation tokens — they're requested on-demand and
// kept in-memory for the duration of a single request.

export const GITHUB_API_BASE = 'https://api.github.com';

export interface GithubAppConfigRow {
  id: string;
  app_id: number | null;
  app_slug: string | null;
  client_id: string | null;
  client_secret: string | null;
  private_key_pem: string | null;
  webhook_secret: string | null;
  verified_at: string | null;
  updated_at: string;
}

export interface GithubAppConfigSummary {
  configured: boolean;
  app_id: number | null;
  app_slug: string | null;
  client_id: string | null;
  private_key_pem_set: boolean;
  webhook_secret_set: boolean;
  client_secret_set: boolean;
  verified_at: string | null;
  updated_at: string | null;
}

export function summarizeConfig(row: GithubAppConfigRow | null): GithubAppConfigSummary {
  if (!row) {
    return {
      configured: false,
      app_id: null,
      app_slug: null,
      client_id: null,
      private_key_pem_set: false,
      webhook_secret_set: false,
      client_secret_set: false,
      verified_at: null,
      updated_at: null,
    };
  }
  const hasCore = Boolean(row.app_id && row.app_slug && row.private_key_pem);
  return {
    configured: hasCore,
    app_id: row.app_id,
    app_slug: row.app_slug,
    client_id: row.client_id,
    private_key_pem_set: Boolean(row.private_key_pem),
    webhook_secret_set: Boolean(row.webhook_secret),
    client_secret_set: Boolean(row.client_secret),
    verified_at: row.verified_at,
    updated_at: row.updated_at,
  };
}

export async function loadGithubAppConfig(): Promise<GithubAppConfigRow | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('github_app_config')
    .select(
      'id, app_id, app_slug, client_id, client_secret, private_key_pem, webhook_secret, verified_at, updated_at',
    )
    .limit(1)
    .maybeSingle<GithubAppConfigRow>();
  if (error) {
    console.error('[github-app] config load failed', error);
    return null;
  }
  return data;
}

// ---------- JWT (RS256) ----------

function base64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Mint a short-lived GitHub App JWT (RS256). 10-minute max lifetime per
 * GitHub's spec; we set iat 30s in the past to absorb minor clock drift.
 */
export function mintAppJwt(appId: number, privateKeyPem: string): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now - 30, exp: now + 9 * 60, iss: appId };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = createPrivateKey({ key: privateKeyPem, format: 'pem' });
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = base64url(signer.sign(key));

  return `${signingInput}.${signature}`;
}

// ---------- GitHub API fetch ----------

export interface GithubFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token: string;
  tokenType: 'app-jwt' | 'installation';
}

export interface GithubFetchResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function githubFetch<T = unknown>(
  path: string,
  options: GithubFetchOptions,
): Promise<GithubFetchResult<T>> {
  const url = `${GITHUB_API_BASE}${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    Authorization: `Bearer ${options.token}`,
    'User-Agent': 'sh1pt-actions-fleet',
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  }

  const text = await response.text();
  let parsed: unknown;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const message = isObject(parsed) && typeof parsed.message === 'string' ? parsed.message : response.statusText;
    return { ok: false, status: response.status, error: message };
  }
  return { ok: true, status: response.status, data: parsed as T };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// ---------- Installation token ----------

export interface InstallationTokenResponse {
  token: string;
  expires_at: string;
  repository_selection?: 'all' | 'selected';
  permissions?: Record<string, string>;
}

/**
 * Exchange an app JWT for an installation access token. Tokens are
 * short-lived (~1h) — caller should mint a fresh one per request.
 */
export async function mintInstallationToken(
  appJwt: string,
  installationId: number,
): Promise<GithubFetchResult<InstallationTokenResponse>> {
  return githubFetch<InstallationTokenResponse>(
    `/app/installations/${installationId}/access_tokens`,
    { method: 'POST', token: appJwt, tokenType: 'app-jwt' },
  );
}

// ---------- High-level helpers ----------

export interface VerifiedAppInfo {
  id: number;
  slug: string;
  name: string;
  owner: { login: string; type: string };
  permissions?: Record<string, string>;
  events?: string[];
}

export async function verifyAppCredentials(
  appId: number,
  privateKeyPem: string,
): Promise<GithubFetchResult<VerifiedAppInfo>> {
  let jwt: string;
  try {
    jwt = mintAppJwt(appId, privateKeyPem);
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? `Invalid private key: ${err.message}` : 'Invalid private key',
    };
  }
  return githubFetch<VerifiedAppInfo>('/app', { token: jwt, tokenType: 'app-jwt' });
}

// ---------- CSRF state cookie (install flow) ----------

const INSTALL_STATE_COOKIE = 'sh1pt_gh_install_state';
const INSTALL_STATE_MAX_AGE = 60 * 10; // 10 minutes

export function newInstallState(): string {
  return randomUUID();
}

export { INSTALL_STATE_COOKIE, INSTALL_STATE_MAX_AGE };
