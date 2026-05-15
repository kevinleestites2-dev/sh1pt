# sh1pt Perry Hono Supabase Boilerplate

## What this is

A sh1pt boilerplate for native TypeScript CLIs and workers built with PerryTS,
backed by a centralized Hono API on Node/Bun, Supabase/Postgres for persistence,
and an optional Next.js web/PWA shell.

It's intended for projects that need:

- a single-binary CLI distributable on every major platform,
- a long-running native worker/agent that talks to a central API,
- a portable HTTP API consumed by web, mobile, desktop, CLI, and third parties,
- a shared SDK and schemas across every client.

## What PerryTS replaces

PerryTS replaces the Node/Bun runtime for selected native binaries — primarily
`apps/cli` and `apps/worker`, and optionally `apps/api` once the runtime
proves stable.

## What PerryTS does not replace by default

PerryTS does **not** replace the browser/PWA web framework in this boilerplate.
SSR, SEO/OpenGraph, and PWA behavior live in `apps/web` (Next.js).

## Architecture

```
Next.js   = optional browser SSR/PWA shell  (apps/web)
Hono      = centralized API                 (apps/api)
PerryTS   = native CLI / workers / agents   (apps/cli, apps/worker)
Supabase  = Postgres + Auth                 (server-side only privileged keys)
```

`apps/web` should call `apps/api` over HTTP. Business logic lives in
`packages/core` and `packages/db`, never in Next.js route handlers or server
actions, so every client (web, CLI, worker, future mobile/desktop) uses the
same backend.

## Layout

```
apps/
  api/      Hono central API (Node/Bun stable, PerryTS experimental)
  cli/      PerryTS-compiled CLI binary
  worker/   PerryTS-compiled long-running worker/agent
  web/      Optional Next.js web/PWA shell

packages/
  core/     Domain logic (jobs, devices, permissions, etc.)
  db/       Supabase client + privileged queries (server-only)
  schemas/  Zod schemas shared by API, SDK, CLI, worker, tests
  sdk/      Typed API client used by every client
```

## Getting started

```sh
pnpm install
cp .env.example .env

pnpm dev:api      # starts the central API on :3001
pnpm dev:web      # optional: Next.js on :3000
pnpm dev:worker   # node-based worker dev loop

pnpm build:cli    # tsc build (Node/Bun-runnable)
pnpm build:worker # tsc build (Node/Bun-runnable)
```

## Building native binaries with PerryTS

PerryTS is invoked as an external tool — install it separately, then:

```sh
pnpm perry:build:cli      # -> dist/sh1pt-cli
pnpm perry:build:worker   # -> dist/sh1pt-worker
```

Each Perry app also has its own `perry.toml` for per-app overrides.

## API

Stable runtime: Node.js or Bun.
Experimental runtime: PerryTS (`apps/api/src/runtime/perry.ts`).

Required endpoints:

```
GET    /health
GET    /version

POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /me

POST   /devices/register
GET    /devices
GET    /devices/:id
DELETE /devices/:id

POST   /jobs
GET    /jobs
GET    /jobs/:id
POST   /jobs/:id/cancel

POST   /worker/heartbeat
GET    /worker/jobs/next
POST   /worker/jobs/:id/complete
POST   /worker/jobs/:id/fail
```

## Database

Apply `supabase/schema.sql` to your Supabase/Postgres instance. Migrations
(via `supabase migration` or your tool of choice) are intentionally left to
the consumer of the boilerplate.

## Deployment

- `apps/web`     → Vercel / Cloudflare Pages / Railway
- `apps/api`     → Railway / Fly.io / VPS / Docker (`Dockerfile.api`)
- `apps/worker`  → VPS / customer machine / Docker (`Dockerfile.worker`)
- `apps/cli`     → GitHub Releases (multi-platform PerryTS binaries)
- database       → Supabase
- queue/cache    → Upstash / Railway Redis / self-hosted

## Security notes

- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it to `apps/web`.
- API keys are hashed at rest.
- All worker heartbeats are authenticated.
- All job payloads are validated with `packages/schemas`.

## License

MIT
