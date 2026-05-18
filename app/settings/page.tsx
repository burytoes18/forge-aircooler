export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <header>
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">Configuration</div>
        <h1 className="font-display text-4xl">Settings</h1>
        <p className="text-muted mt-2 max-w-2xl">
          Forge uses two external services. Both are free at this scale.
        </p>
      </header>

      <div className="space-y-6 max-w-2xl">
        {/* Anthropic */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl">Anthropic API</h2>
            <p className="text-sm text-muted mt-1">
              Powers all AI research — Ask queries, workflow plans, and deliverables. Your key lives in the{' '}
              <code className="font-mono text-xs bg-ink/5 px-1 rounded">.env.local</code> file on your server,
              never in the browser or Supabase.
            </p>
          </div>
          <div className="border-l-2 border-rule pl-4 text-sm text-muted space-y-1">
            <div>Get your key at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">console.anthropic.com</a></div>
            <div>Default model: <span className="font-mono text-xs">claude-sonnet-4-6</span></div>
            <div>Web search: $10 per 1,000 searches — typical session uses 5–20 searches</div>
          </div>
        </div>

        {/* Supabase */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl">Supabase</h2>
            <p className="text-sm text-muted mt-1">
              Stores all deliverables, benchmarks, workflow runs, and the project brief. Free tier is more than
              enough for this project.
            </p>
          </div>
          <div className="border-l-2 border-rule pl-4 text-sm text-muted space-y-1">
            <div>Dashboard at <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">supabase.com/dashboard</a></div>
            <div>Three env vars needed: <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>, <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code></div>
          </div>
        </div>

        {/* Vercel */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl">Vercel</h2>
            <p className="text-sm text-muted mt-1">
              Hosts the app. Free Hobby plan works. Add all env vars in the Vercel dashboard under
              Project → Settings → Environment Variables.
            </p>
          </div>
          <div className="border-l-2 border-rule pl-4 text-sm text-muted space-y-1">
            <div>Dashboard at <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">vercel.com/dashboard</a></div>
            <div>Set the same <code className="font-mono text-xs">.env.local</code> vars as Vercel environment variables</div>
          </div>
        </div>

        {/* Env reference */}
        <div className="card p-6 space-y-3">
          <h2 className="font-display text-xl">Environment variables reference</h2>
          <p className="text-sm text-muted">Copy this into your <code className="font-mono text-xs bg-ink/5 px-1 rounded">.env.local</code> file.</p>
          <pre className="bg-ink text-paper text-xs font-mono p-4 rounded-sm overflow-x-auto leading-relaxed">{`ANTHROPIC_API_KEY=sk-ant-...

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional: location for web search results (defaults to Bengaluru)
USER_LOCATION_CITY=Bengaluru
USER_LOCATION_REGION=Karnataka
USER_LOCATION_COUNTRY=IN`}</pre>
        </div>
      </div>
    </div>
  );
}
