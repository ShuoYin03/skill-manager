'use client'

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Simple pricing</h2>
          <p className="mt-4 text-lg text-gray-400">
            One-time purchase. No subscriptions. Free updates forever.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-sm">
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-500/10 to-transparent p-8 text-center">
            <div className="text-sm font-medium text-blue-300">Lifetime License</div>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold">$5</span>
              <span className="text-gray-500">one-time</span>
            </div>
            <ul className="mt-8 space-y-3 text-left text-sm text-gray-300">
              {[
                'Unlimited repos',
                'All editors supported',
                'Cross-platform (macOS, Windows, Linux)',
                'Free updates forever',
                '7-day free trial included',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="mt-0.5 shrink-0 text-blue-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#download"
              className="mt-8 block rounded-xl bg-blue-500 py-3 text-center font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400"
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
