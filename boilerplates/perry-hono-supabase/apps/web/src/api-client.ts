import { createClient, type Client } from '@sh1pt/sdk';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function publicApi(): Client {
  return createClient({ baseUrl });
}

export function authedApi(token: string): Client {
  return createClient({ baseUrl, token });
}
