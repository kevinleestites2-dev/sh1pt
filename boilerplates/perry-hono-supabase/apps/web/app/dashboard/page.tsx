export default function DashboardPage() {
  return (
    <main style={{ padding: 32, maxWidth: 720 }}>
      <h1>Dashboard</h1>
      <p>
        This is a placeholder for the authenticated dashboard. Wire up your
        auth flow (Supabase Auth in the browser, or your own session cookie)
        and call <code>authedApi(token)</code> from{' '}
        <code>src/api-client.ts</code>.
      </p>
      <p>
        <a href="/">← Back</a>
      </p>
    </main>
  );
}
