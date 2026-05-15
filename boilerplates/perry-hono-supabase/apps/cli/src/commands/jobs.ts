import { createClient } from '@sh1pt/sdk';
import { loadConfig } from '../config.ts';

function api() {
  const cfg = loadConfig();
  if (!cfg.token) {
    throw new Error('Not logged in. Run: sh1pt login');
  }
  return createClient({ baseUrl: cfg.apiUrl, token: cfg.token });
}

export async function jobsListCmd(): Promise<number> {
  const jobs = await api().jobs.list();
  for (const j of jobs) {
    console.log(`${j.id}  ${j.status.padEnd(10)}  ${j.type}`);
  }
  return 0;
}

export async function jobsGetCmd(args: string[]): Promise<number> {
  const id = args[0];
  if (!id) {
    console.error('Usage: sh1pt jobs get <id>');
    return 1;
  }
  const job = await api().jobs.get(id);
  console.log(JSON.stringify(job, null, 2));
  return 0;
}

export async function jobsCreateCmd(args: string[]): Promise<number> {
  const type = args[0];
  if (!type) {
    console.error('Usage: sh1pt jobs create <type> [json-input]');
    return 1;
  }
  const input = args[1] ? (JSON.parse(args[1]) as Record<string, unknown>) : {};
  const job = await api().jobs.create({ type, input });
  console.log(job.id);
  return 0;
}

export async function jobsCancelCmd(args: string[]): Promise<number> {
  const id = args[0];
  if (!id) {
    console.error('Usage: sh1pt jobs cancel <id>');
    return 1;
  }
  const job = await api().jobs.cancel(id);
  console.log(`${job.id}  ${job.status}`);
  return 0;
}
