'use client'

import { trackEvent } from '@/lib/analytics'

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-[#E5E7EB] bg-[#FAFAFA] py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#0A0A0A] sm:text-4xl">Simple pricing</h2>
          <p className="mt-4 text-lg text-[#6B7280]">
            One-time purchase. Unlimited skills, unlimited projects. No subscriptions.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-sm">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Lifetime License</div>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold text-[#0A0A0A]">$5</span>
              <span className="text-[#9CA3AF]">one-time</span>
            </div>
            <ul className="mt-8 space-y-3 text-left text-sm text-[#6B7280]">
              {[
                'Unlimited repos',
                'All editors supported',
                'Cross-platform (macOS, Windows, Linux)',
                'Free updates forever',
                '7-day free trial included',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="mt-0.5 shrink-0 text-[#0A0A0A]">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#download"
              onClick={() =>
                trackEvent('trial_started', {
                  source: 'pricing',
                  target: 'download_section'
                })
              }
              className="mt-8 block rounded-lg bg-[#0A0A0A] py-3 text-center font-semibold text-white transition hover:bg-[#333]"
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
