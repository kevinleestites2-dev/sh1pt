import { createClient } from '@sh1pt/sdk';
import { loadConfig } from '../config.ts';

export async function statusCmd(): Promise<number> {
  const cfg = loadConfig();
  console.log(`API:    ${cfg.apiUrl}`);
  console.log(`Token:  ${cfg.token ? '***present***' : '(none)'}`);
  console.log(`Device: ${cfg.deviceId ?? '(unregistered)'}`);

  const api = createClient({ baseUrl: cfg.apiUrl });
  try {
    const health = await api.http.request<{ ok: boolean }>('/health');
    console.log(`Health: ${health.ok ? 'ok' : 'degraded'}`);
  } catch (err) {
    console.log(`Health: unreachable (${(err as Error).message})`);
    return 1;
  }
  return 0;
}
