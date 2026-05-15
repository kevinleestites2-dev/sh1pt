import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface CliConfig {
  apiUrl: string;
  token?: string;
  deviceId?: string;
}

const CONFIG_DIR = join(homedir(), '.config', 'sh1pt');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULTS: CliConfig = {
  apiUrl: process.env.API_URL ?? 'http://localhost:3001',
};

export function loadConfig(): CliConfig {
  if (!existsSync(CONFIG_FILE)) return { ...DEFAULTS };
  try {
    const raw = JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) as Partial<CliConfig>;
    return { ...DEFAULTS, ...raw };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveConfig(cfg: CliConfig): void {
  mkdirSync(dirname(CONFIG_FILE), { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

export const configPath = CONFIG_FILE;
