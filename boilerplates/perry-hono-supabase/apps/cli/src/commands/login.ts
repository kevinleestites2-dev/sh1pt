import { createClient } from '@sh1pt/sdk';
import { loadConfig, saveConfig } from '../config.ts';

/**
 * v1: manual token paste. Future: device-code flow.
 *
 * Usage: sh1pt login --token <jwt>
 *        sh1pt login (prompts via stdin)
 */
export async function loginCmd(args: string[]): Promise<number> {
  const cfg = loadConfig();
  const tokenIdx = args.indexOf('--token');
  let token = tokenIdx >= 0 ? args[tokenIdx + 1] : undefined;

  if (!token) {
    token = await readLine('Paste access token: ');
  }
  if (!token) {
    console.error('No token provided.');
    return 1;
  }

  const api = createClient({ baseUrl: cfg.apiUrl, token });
  try {
    const me = await api.auth.me();
    saveConfig({ ...cfg, token });
    console.log(`Logged in as ${me.email ?? me.id}`);
    return 0;
  } catch (err) {
    console.error('Login failed:', (err as Error).message);
    return 1;
  }
}

export async function logoutCmd(): Promise<number> {
  const cfg = loadConfig();
  saveConfig({ ...cfg, token: undefined });
  console.log('Logged out.');
  return 0;
}

function readLine(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    let buf = '';
    process.stdin.setEncoding('utf8');
    const onData = (chunk: string) => {
      buf += chunk;
      const nl = buf.indexOf('\n');
      if (nl >= 0) {
        process.stdin.removeListener('data', onData);
        process.stdin.pause();
        resolve(buf.slice(0, nl).trim());
      }
    };
    process.stdin.on('data', onData);
    process.stdin.resume();
  });
}
