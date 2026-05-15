import { createClient } from '@sh1pt/sdk';
import { handlers } from './jobs/example.ts';

interface WorkerEnv {
  apiUrl: string;
  token: string;
  deviceId: string;
  pollMs: number;
  heartbeatMs: number;
}

function loadEnv(): WorkerEnv {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const token = process.env.SH1PT_WORKER_TOKEN ?? '';
  const deviceId = process.env.SH1PT_DEVICE_ID ?? '';
  if (!token) throw new Error('SH1PT_WORKER_TOKEN is required');
  if (!deviceId) throw new Error('SH1PT_DEVICE_ID is required');
  return {
    apiUrl,
    token,
    deviceId,
    pollMs: Number(process.env.SH1PT_POLL_MS ?? 2000),
    heartbeatMs: Number(process.env.SH1PT_HEARTBEAT_MS ?? 15000),
  };
}

async function main(): Promise<void> {
  const env = loadEnv();
  const api = createClient({ baseUrl: env.apiUrl, token: env.token });

  const heartbeatHeaders = { 'x-device-id': env.deviceId };
  let stopping = false;

  const stop = () => {
    stopping = true;
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  const heartbeatLoop = (async () => {
    while (!stopping) {
      try {
        await api.http.request('/worker/heartbeat', {
          method: 'POST',
          headers: heartbeatHeaders,
          body: { capabilities: { handlers: [...handlers.keys()] } },
        });
      } catch (err) {
        console.error('[worker] heartbeat failed:', (err as Error).message);
      }
      await sleep(env.heartbeatMs);
    }
  })();

  console.log(`[worker] device=${env.deviceId} api=${env.apiUrl}`);

  while (!stopping) {
    try {
      const next = await api.http.request<unknown>('/worker/jobs/next', {
        headers: heartbeatHeaders,
      });
      if (!next || typeof next !== 'object') {
        await sleep(env.pollMs);
        continue;
      }
      const job = next as { id: string; type: string; input: Record<string, unknown> };
      const handler = handlers.get(job.type);
      if (!handler) {
        await api.worker.failJob(job.id, { error: `no handler for type ${job.type}` });
        continue;
      }
      console.log(`[worker] running ${job.id} (${job.type})`);
      try {
        const output = await handler.run(job as never);
        await api.worker.completeJob(job.id, { output });
        console.log(`[worker] completed ${job.id}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await api.worker.failJob(job.id, { error: msg });
        console.error(`[worker] failed ${job.id}: ${msg}`);
      }
    } catch (err) {
      console.error('[worker] poll error:', (err as Error).message);
      await sleep(env.pollMs);
    }
  }

  await heartbeatLoop;
  console.log('[worker] stopped');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
