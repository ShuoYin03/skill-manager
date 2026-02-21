export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      {/* Gradient blob */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-sm text-blue-300">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
          7-day free trial — no credit card required
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Open any repo in{' '}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            one keystroke
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 leading-relaxed">
          Stop hunting through File &gt; Open Folder. Repo Launcher gives you a global
          hotkey that brings up a Spotlight-like search bar — fuzzy-find any project and
          open it in VSCode, Cursor, WebStorm, or your editor of choice. Instantly.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="#download"
            className="rounded-xl bg-blue-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400"
          >
            Download Free
          </a>
          <a
            href="#features"
            className="rounded-xl border border-white/15 px-8 py-3.5 text-base font-semibold text-gray-300 transition hover:bg-white/5"
          >
            See features
          </a>
        </div>

        {/* Screenshot placeholder */}
        <div className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-xs text-gray-500">Repo Launcher</span>
          </div>
          <div className="px-6 py-8">
            {/* Simulated search bar */}
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-white/10 bg-gray-800 px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <span className="text-gray-400">my-proj</span>
              <span className="ml-auto text-xs text-gray-600">Cmd+Shift+O</span>
            </div>
            {/* Simulated repo list */}
            {[
              { name: 'my-project', branch: 'main', path: '~/Code/my-project', selected: true },
              { name: 'my-project-api', branch: 'develop', path: '~/Code/my-project-api', selected: false },
              { name: 'my-project-docs', branch: 'main', path: '~/Code/my-project-docs', selected: false },
            ].map((repo) => (
              <div
                key={repo.name}
                className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                  repo.selected ? 'border-l-2 border-blue-400 bg-blue-500/10' : 'hover:bg-white/5'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-white">{repo.name}</div>
                  <div className="text-xs text-gray-500">{repo.path}</div>
                </div>
                <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                  {repo.branch}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
