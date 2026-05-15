import { createAuthApi } from './auth.ts';
import { createUsersApi } from './users.ts';
import { createDevicesApi } from './devices.ts';
import { createJobsApi, createWorkerApi } from './jobs.ts';

export interface ClientOptions {
  baseUrl: string;
  token?: string;
  fetch?: typeof fetch;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface HttpClient {
  request<T>(path: string, opts?: RequestOptions): Promise<T>;
  setToken(token: string | undefined): void;
  getToken(): string | undefined;
}

export interface Client {
  http: HttpClient;
  auth: ReturnType<typeof createAuthApi>;
  users: ReturnType<typeof createUsersApi>;
  devices: ReturnType<typeof createDevicesApi>;
  jobs: ReturnType<typeof createJobsApi>;
  worker: ReturnType<typeof createWorkerApi>;
}

export function createClient(opts: ClientOptions): Client {
  const fetchImpl = opts.fetch ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error('No fetch implementation available; pass options.fetch');
  }
  let token = opts.token;

  const http: HttpClient = {
    async request<T>(path: string, req: RequestOptions = {}): Promise<T> {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
        ...req.headers,
      };
      if (token) headers.authorization = `Bearer ${token}`;

      const res = await fetchImpl(`${opts.baseUrl}${path}`, {
        method: req.method ?? 'GET',
        headers,
        body: req.body === undefined ? undefined : JSON.stringify(req.body),
        signal: req.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new SdkError(res.status, text || res.statusText);
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    },
    setToken(t) {
      token = t;
    },
    getToken() {
      return token;
    },
  };

  return {
    http,
    auth: createAuthApi(http),
    users: createUsersApi(http),
    devices: createDevicesApi(http),
    jobs: createJobsApi(http),
    worker: createWorkerApi(http),
  };
}

export class SdkError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'SdkError';
  }
}
