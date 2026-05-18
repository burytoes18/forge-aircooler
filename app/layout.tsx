import './globals.css';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata = {
  title: 'Forge — Hardware Research Workspace',
  description: 'Multi-domain research workbench for hardware product development',
};

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/ask', label: 'Ask' },
  { href: '/workflows', label: 'Workflows' },
  { href: '/deliverables', label: 'Deliverables' },
  { href: '/benchmarks', label: 'Benchmarks' },
  { href: '/brief', label: 'Project Brief' },
  { href: '/settings', label: 'Settings' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex">
          <aside className="w-60 shrink-0 border-r border-rule bg-paper/40 px-6 py-8 flex flex-col gap-8">
            <Link href="/" className="block">
              <div className="font-display text-3xl leading-none tracking-tight">Forge</div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted mt-1">
                hardware r&d
              </div>
            </Link>

            <nav className="flex flex-col gap-1">
              {NAV.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-2 py-1.5 text-sm rounded-sm hover:bg-ink hover:text-paper transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto text-[11px] font-mono uppercase tracking-widest text-muted">
              Radiator-principle<br/>air cooler
            </div>
          </aside>

          <main className="flex-1 min-w-0 px-10 py-10 max-w-5xl">
            <Suspense fallback={<div className="text-muted">Loading…</div>}>
              {children}
            </Suspense>
          </main>
        </div>
      </body>
    </html>
  );
}
