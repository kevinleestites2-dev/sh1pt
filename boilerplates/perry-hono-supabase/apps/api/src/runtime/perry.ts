// Experimental: serve the Hono app from a PerryTS-compiled native binary.
//
// PerryTS compatibility for HTTP servers is still being proven, so this
// entrypoint is intentionally a thin shim. Once Perry exposes a stable
// listener API, replace the body of `main` to bind it.
//
// Until then, prefer apps/api/src/runtime/node.ts in production.

import { createApp } from '../app.ts';
import { env } from '../env.ts';

const app = createApp();

declare const Perry:
  | {
      serve?: (opts: {
        port: number;
        fetch: (req: Request) => Response | Promise<Response>;
      }) => void;
    }
  | undefined;

async function main(): Promise<void> {
  if (typeof Perry !== 'undefined' && Perry?.serve) {
    Perry.serve({ port: env.PORT, fetch: app.fetch });
    console.log(`[api/perry] listening on :${env.PORT}`);
    return;
  }

  // Fallback path so this file is also runnable under Node/Bun during dev.
  const { serve } = await import('@hono/node-server');
  serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    console.log(`[api/perry-fallback] listening on http://localhost:${info.port}`);
  });
}

void main();
