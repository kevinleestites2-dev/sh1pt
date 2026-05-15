import { publicApi } from '../src/api-client.ts';

export default async function HomePage() {
  let healthy = false;
  try {
    const res = await publicApi().http.request<{ ok: boolean }>('/health');
    healthy = res.ok;
  } catch {
    healthy = false;
  }

  return (
    <main style={{ padding: 32, maxWidth: 720 }}>
      <h1>sh1pt</h1>
      <p>
        PerryTS-first boilerplate: native CLIs/workers, centralized Hono API,
        Supabase backend, optional Next.js shell (this page).
      </p>
      <p>
        API status:{' '}
        <strong style={{ color: healthy ? 'green' : 'crimson' }}>
          {healthy ? 'up' : 'down'}
        </strong>
      </p>
      <p>
        <a href="/dashboard">Go to dashboard →</a>
      </p>
    </main>
  );
}
