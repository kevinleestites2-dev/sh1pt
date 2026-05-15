# @sh1pt/api

Centralized Hono API. Two runtimes:

- `src/runtime/node.ts` — stable, used by `pnpm dev:api` and `pnpm build:api`.
- `src/runtime/perry.ts` — experimental, compiled by PerryTS once Perry's HTTP
  listener API stabilizes. Falls back to `@hono/node-server` if `Perry.serve`
  is not present at runtime.

Endpoints are documented in the root `README.md`. Schemas live in
`@sh1pt/schemas`; database access goes through `@sh1pt/db`; cross-app domain
logic lives in `@sh1pt/core`.
