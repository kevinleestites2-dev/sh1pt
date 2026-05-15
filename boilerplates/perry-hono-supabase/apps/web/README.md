# @sh1pt/web

Optional Next.js shell. Use it only when you need:

- SSR / SEO / OpenGraph
- public landing or marketing pages
- a browser-rendered dashboard with a PWA manifest / service worker

This app calls the central API (`@sh1pt/api`) via the shared SDK
(`@sh1pt/sdk`). It must **not** own product business logic and must **not**
hold the Supabase service-role key.

## Env

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
