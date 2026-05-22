import type { ReactNode } from 'react';

export const metadata = { title: 'sh1pt · next + supabase' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}        <script data-site="475e7e62-b048-44da-90b4-746d1ba512d2" src="https://crawlproof.com/stats.js" async></script>
      </body>
    </html>
  );
}
