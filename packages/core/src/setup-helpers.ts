// Reusable setup() builders. Every adapter's setup() should be one of
// these — bespoke flows are the exception, not the rule. Keeps the 175
// adapter surfaces consistent without forcing every package to hand-roll
// the prompt/validate/persist dance.
//
// Priority order (matches feedback_secrets_and_scraping.md):
//   1. webhookUrlSetup — paste a vendor-provided URL (fastest, no OAuth)
//   2. tokenSetup      — paste a static API key / bearer token
//   3. oauthSetup      — OAuth-style (falls back to manual token paste
//                        until the cloud redirect flow lands)
//   4. manualSetup     — no automation path; print steps, save nothing
//   5. stubSetup       — default for adapters that haven't declared
//                        anything yet (used by defineXxx() auto-default)

import type { SetupContext, SetupResult } from './setup.js';

type SetupFn<C = unknown> = (ctx: SetupContext) => Promise<SetupResult<C>>;

// Helper used by defineXxx() wrappers to auto-install a stub setup on
// every adapter without needing to edit 175 packages. Adapters that
// provide their own setup keep it; the rest get stubSetup(label).
export function autoSetup<T extends { label: string; setup?: SetupFn<any> }>(adapter: T): T {
  return { ...adapter, setup: adapter.setup ?? stubSetup(adapter.label) };
}

// Default fallback for adapters that haven't declared a real setup yet.
// Emitted automatically by every defineXxx() so `sh1pt <cat> <name> setup`
// is always available.
export function stubSetup<C = unknown>(label?: string): SetupFn<C> {
  return async (ctx) => {
    const name = label ?? 'this adapter';
    ctx.log(`${name}: setup() not wired yet — only the generic fallback runs.`);
    return {
      ok: false,
      config: {} as C,
      manual: [
        `${name} has no adapter-specific setup flow yet.`,
        'File an issue to prioritize: https://github.com/profullstack/sh1pt/issues',
      ],
    };
  };
}

// For webhook-style adapters (Discord, Slack, Teams, generic HTTP, Telegram bot).
// User pastes a URL; we validate the prefix (optional), write to the vault,
// persist a small config marker.
export interface WebhookUrlSetupOpts<C = unknown> {
  secretKey: string;               // vault key, e.g. 'DISCORD_WEBHOOK_URL'
  label: string;                   // human name, e.g. 'Discord (channel webhook)'
  urlPrefix?: string;              // validation prefix, e.g. 'https://discord.com/api/webhooks/'
  vendorDocUrl?: string;           // opened in browser for context
  steps: string[];                 // manual fallback + pre-paste guidance
  config?: C;                      // marker written to config.json
}

export function webhookUrlSetup<C = unknown>(opts: WebhookUrlSetupOpts<C>): SetupFn<C> {
  return async (ctx) => {
    const existing = ctx.secret(opts.secretKey);
    const validPrefix = (v: string) => !opts.urlPrefix || v.startsWith(opts.urlPrefix);

    if (existing && validPrefix(existing)) {
      const reuse = await ctx.prompt<boolean>({
        type: 'confirm',
        message: `${opts.secretKey} already in vault — reuse it?`,
        initial: true,
      });
      if (reuse) return { ok: true, config: (opts.config ?? {}) as C };
    }

    ctx.log(`${opts.label} — paste a webhook URL. Steps:`);
    for (const line of opts.steps) ctx.log(`  ${line}`);
    if (opts.vendorDocUrl) await ctx.open(opts.vendorDocUrl);

    const url = await ctx.prompt<string>({
      type: 'password',
      message: `Paste the ${opts.label} URL:`,
      validate: opts.urlPrefix
        ? (v) => (!v || v.startsWith(opts.urlPrefix!)) || `Must start with ${opts.urlPrefix}`
        : undefined,
    });

    if (!url || !validPrefix(url)) {
      return { ok: false, config: (opts.config ?? {}) as C, manual: opts.steps };
    }

    await ctx.setSecret(opts.secretKey, url);
    return { ok: true, config: (opts.config ?? {}) as C };
  };
}

// For static-token auth (most APIs: Stripe, Resend, Linear, Porkbun, etc.).
export interface TokenSetupOpts<C = unknown> {
  secretKey: string;               // vault key, e.g. 'STRIPE_SECRET_KEY'
  label: string;                   // human name, e.g. 'Stripe'
  vendorDocUrl?: string;
  steps: string[];
  config?: C;
  // Extra prompts after the primary token (account id, workspace id, etc.).
  // Non-secret values get returned in the config; secret values go to the vault.
  fields?: Array<{
    key: string;                   // config key or secret key
    message: string;
    secret?: boolean;
    required?: boolean;
  }>;
}

export function tokenSetup<C = unknown>(opts: TokenSetupOpts<C>): SetupFn<C> {
  return async (ctx) => {
    const existing = ctx.secret(opts.secretKey);
    if (existing) {
      const reuse = await ctx.prompt<boolean>({
        type: 'confirm',
        message: `${opts.secretKey} already in vault — reuse it?`,
        initial: true,
      });
      if (reuse) return { ok: true, config: (opts.config ?? {}) as C };
    }

    ctx.log(`${opts.label} setup:`);
    for (const line of opts.steps) ctx.log(`  ${line}`);
    if (opts.vendorDocUrl) await ctx.open(opts.vendorDocUrl);

    const token = await ctx.prompt<string>({
      type: 'password',
      message: `Paste the ${opts.label} API token:`,
    });

    if (!token) {
      return { ok: false, config: (opts.config ?? {}) as C, manual: opts.steps };
    }
    await ctx.setSecret(opts.secretKey, token);

    const configExtras: Record<string, string> = {};
    for (const field of opts.fields ?? []) {
      const val = await ctx.prompt<string>({
        type: field.secret ? 'password' : 'text',
        message: field.message,
      });
      if (!val && field.required) {
        return {
          ok: false,
          config: { ...(opts.config ?? {}), ...configExtras } as unknown as C,
          manual: [`Required field "${field.key}" not supplied — re-run setup.`, ...opts.steps],
        };
      }
      if (val) {
        if (field.secret) await ctx.setSecret(field.key, val);
        else configExtras[field.key] = val;
      }
    }

    return { ok: true, config: { ...(opts.config ?? {}), ...configExtras } as unknown as C };
  };
}

// OAuth adapters — until the cloud redirect flow lands, we fall back to
// the manual-token-paste path with explicit steps for the vendor's
// developer console.
export interface OAuthSetupOpts<C = unknown> {
  secretKey: string;
  label: string;
  vendorDocUrl?: string;
  steps: string[];
  config?: C;
}

export function oauthSetup<C = unknown>(opts: OAuthSetupOpts<C>): SetupFn<C> {
  return async (ctx) => {
    ctx.log(`${opts.label} uses OAuth. Automated OAuth flow isn't wired yet — capturing a token manually.`);
    for (const line of opts.steps) ctx.log(`  ${line}`);
    if (opts.vendorDocUrl) await ctx.open(opts.vendorDocUrl);

    const token = await ctx.prompt<string>({
      type: 'password',
      message: `Paste the ${opts.label} access token (or leave blank to finish later):`,
    });
    if (!token) {
      return { ok: false, config: (opts.config ?? {}) as C, manual: opts.steps };
    }
    await ctx.setSecret(opts.secretKey, token);
    return { ok: true, config: (opts.config ?? {}) as C };
  };
}

// Browser-mode adapters where the official API is locked behind a paid
// tier (X v2), gated by ID checks (TikTok, Instagram), or simply absent
// (most "social-*" surfaces). The user logs in with their normal browser
// session and pastes the auth cookie(s) back; we save them to the vault
// and the adapter's post() / connect() drives a Playwright session with
// those cookies pre-loaded.
//
// Accepts three input shapes:
//   1. A single value (the user knows the cookie name and pasted only the value)
//   2. `name=value; name2=value2` — the raw `document.cookie` form
//   3. JSON array of `{ name, value, ... }` — the format every browser
//      cookie-export extension produces (Cookie Editor, EditThisCookie, …)
// We pull whichever cookies the adapter declared as required and save
// each under its own vault key.
export interface CookieSetupOpts<C = unknown> {
  label: string;                        // human name, e.g. 'X (Twitter)'
  loginUrl: string;                     // where the user signs in (e.g. 'https://x.com/login')
  // Cookies the adapter needs. Required cookies must all be present after
  // parsing; optional ones are saved if found and skipped otherwise.
  cookies: Array<{
    name: string;                       // cookie name on the vendor domain (e.g. 'auth_token')
    secretKey: string;                  // vault key to save under (e.g. 'X_AUTH_TOKEN')
    description?: string;               // shown to the user, e.g. 'session token'
    required?: boolean;                 // default: true
  }>;
  steps?: string[];                     // extra instructions before pasting
  config?: C;                           // marker written to config.json
}

export function cookieSetup<C = unknown>(opts: CookieSetupOpts<C>): SetupFn<C> {
  return async (ctx) => {
    const required = opts.cookies.filter((c) => c.required !== false);
    const allReadyInVault = required.every((c) => ctx.secret(c.secretKey));
    if (allReadyInVault) {
      const reuse = await ctx.prompt<boolean>({
        type: 'confirm',
        message: `${opts.label} cookies already in vault — reuse them?`,
        initial: true,
      });
      if (reuse) return { ok: true, config: (opts.config ?? {}) as C };
    }

    ctx.log(`${opts.label} — sign in with your normal browser, then come back here.`);
    ctx.log(`  1. Open ${opts.loginUrl} and sign in.`);
    if (opts.cookies.length === 1) {
      const c = opts.cookies[0]!;
      ctx.log(`  2. Open DevTools → Application → Cookies, copy the value of "${c.name}"${c.description ? ` (${c.description})` : ''}.`);
    } else {
      ctx.log(`  2. Export your cookies for this domain. Either:`);
      ctx.log(`       a) Use a "Cookie Editor" extension and copy the JSON export, or`);
      ctx.log(`       b) Run \`document.cookie\` in the JS console and copy the whole string.`);
      ctx.log(`     We need: ${opts.cookies.map((c) => c.name).join(', ')}.`);
      ctx.log(`     If the paste-all step misses anything, we'll ask for each cookie individually.`);
    }
    if (opts.steps) for (const line of opts.steps) ctx.log(`  ${line}`);
    ctx.log(`  3. Paste below. Nothing leaves your machine until it's encrypted.`);
    await ctx.open(opts.loginUrl);

    const found: Record<string, string> = {};

    // Step A: try a paste-all input first. Use a visible 'text' prompt
    // since long pastes through 'password' (asterisk redraw per char)
    // get mangled in a lot of terminals. The pasted blob is ephemeral —
    // it leaves the screen as soon as the user presses Enter.
    const raw = await ctx.prompt<string>({
      type: 'text',
      message:
        opts.cookies.length === 1
          ? `Paste ${opts.cookies[0]!.name} value (or the full document.cookie), or leave blank:`
          : `Paste cookies (JSON export or "name=value; name2=value2"), or leave blank to enter one at a time:`,
    });

    if (raw && raw.trim().length > 0) {
      const parsed = parseCookies(raw);
      if (opts.cookies.length === 1 && Object.keys(parsed).length === 0) {
        // Single-cookie target and no key/value structure detected —
        // treat the whole paste as the value.
        found[opts.cookies[0]!.name] = raw.trim();
      } else {
        for (const c of opts.cookies) {
          const v = parsed[c.name];
          if (v) found[c.name] = v;
        }
      }
      const namesFound = Object.keys(found);
      if (namesFound.length > 0) {
        ctx.log(`  ✓ found in paste: ${namesFound.join(', ')}`);
      } else {
        ctx.log(`  paste didn't yield any of the cookies we need — falling back to one-at-a-time.`);
      }
    }

    // Step B: per-missing-cookie fallback. Mask each individual paste
    // with 'password' (short values, terminals handle them fine).
    for (const c of opts.cookies) {
      if (found[c.name]) continue;
      const must = c.required !== false;
      const v = await ctx.prompt<string>({
        type: 'password',
        message: `Paste ${c.name}${c.description ? ` (${c.description})` : ''}${must ? '' : ' — optional, blank to skip'}:`,
      });
      if (!v) continue;
      // Accept either "name=value" or just the bare value.
      const cleaned = v.trim().replace(new RegExp(`^${escapeRegex(c.name)}\\s*=\\s*`), '');
      if (cleaned) found[c.name] = cleaned;
    }

    const missingRequired = required.filter((c) => !found[c.name]);
    if (missingRequired.length > 0) {
      return {
        ok: false,
        config: (opts.config ?? {}) as C,
        manual: [
          `Couldn't find required cookie(s): ${missingRequired.map((c) => c.name).join(', ')}.`,
          `Make sure you're logged in at ${opts.loginUrl} before exporting cookies, then re-run setup.`,
        ],
      };
    }

    for (const c of opts.cookies) {
      const v = found[c.name];
      if (v) await ctx.setSecret(c.secretKey, v);
    }
    return { ok: true, config: (opts.config ?? {}) as C };
  };
}

// Best-effort cookie parser. Accepts:
//   - JSON array (Cookie Editor / EditThisCookie / Get cookies.txt LOCALLY:
//     [{name, value, ...}, ...])
//   - "name=value; name2=value2" pairs (raw document.cookie)
//   - "name=value" newline-separated pairs (curl --cookie style)
//   - Malformed JSON where the brace structure is broken but
//     "name":"X","value":"Y" pairs are still recoverable (the common
//     terminal-paste corruption mode).
function parseCookies(raw: string): Record<string, string> {
  let trimmed = raw.trim().replace(/^﻿/, '');
  // Strip outer wrapping quotes/backticks if the user's shell escaped
  // the paste (some prompts do this with multi-line content).
  for (const wrap of ['"', "'", '`']) {
    if (trimmed.startsWith(wrap) && trimmed.endsWith(wrap) && trimmed.length > 1) {
      trimmed = trimmed.slice(1, -1);
      break;
    }
  }

  const looksLikeJson = trimmed.startsWith('[') || trimmed.startsWith('{');
  if (looksLikeJson) {
    try {
      const data = JSON.parse(trimmed);
      const arr = Array.isArray(data) ? data : [data];
      const out: Record<string, string> = {};
      for (const entry of arr) {
        if (entry && typeof entry === 'object' && typeof entry.name === 'string' && typeof entry.value === 'string') {
          out[entry.name] = entry.value;
        }
      }
      if (Object.keys(out).length > 0) return out;
    } catch {
      // fall through to regex recovery
    }
    const out: Record<string, string> = {};
    // Recover "name":"X" + "value":"Y" pairs even if the surrounding
    // structure is broken. Cookie Editor puts name before value in
    // every entry, so a sliding regex catches them in pairs.
    const re = /"name"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"[^}]*?"value"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(trimmed)) !== null) {
      try {
        const name = JSON.parse(`"${m[1]!}"`);
        const value = JSON.parse(`"${m[2]!}"`);
        if (typeof name === 'string' && typeof value === 'string') out[name] = value;
      } catch {
        // skip malformed entry
      }
    }
    if (Object.keys(out).length > 0) return out;
  }

  // name=value; name2=value2 OR newline-separated.
  const out: Record<string, string> = {};
  for (const pair of trimmed.split(/[;\n]/)) {
    const eq = pair.indexOf('=');
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim().replace(/^"|"$/g, '');
    if (name) out[name] = value;
  }
  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Pure instructions — no automation possible (App Store identity
// verification, Google Play payment profile, Apple D-U-N-S, etc.).
export interface ManualSetupOpts<C = unknown> {
  label: string;
  vendorDocUrl?: string;
  steps: string[];
  config?: C;
}

export function manualSetup<C = unknown>(opts: ManualSetupOpts<C>): SetupFn<C> {
  return async (ctx) => {
    ctx.log(`${opts.label}: manual setup only — no automation path yet.`);
    for (const line of opts.steps) ctx.log(`  ${line}`);
    if (opts.vendorDocUrl) await ctx.open(opts.vendorDocUrl);
    return {
      ok: false,
      config: (opts.config ?? {}) as C,
      manual: opts.steps,
    };
  };
}
