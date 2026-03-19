'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { trackEvent } from '@/lib/analytics'
import type { User } from '@supabase/supabase-js'

const FEATURES = [
  'Unlimited repos',
  'All editors supported (Claude, Cursor, Windsurf, Copilot)',
  'Cross-platform (macOS, Windows, Linux)',
  'Free updates forever',
  '7-day free trial included',
  '25,000+ skills in marketplace',
]

const FAQ = [
  {
    q: 'Is this a one-time payment?',
    a: 'Yes. You pay $5 once and get lifetime access with all future updates included. No subscriptions, no renewals.',
  },
  {
    q: 'What happens after I pay?',
    a: "Your license is activated instantly. Open the Skilly desktop app and sign in with the same Google account — you'll have full access immediately.",
  },
  {
    q: 'Can I try it before buying?',
    a: 'Absolutely. Skilly includes a 7-day free trial when you download the app. No payment required to start.',
  },
  {
    q: 'Which editors are supported?',
    a: 'Skilly works with Claude Code, Cursor, Windsurf, GitHub Copilot, and more. Cross-platform on macOS, Windows, and Linux.',
  },
  {
    q: 'Is payment secure?',
    a: "All payments are processed by Stripe, the industry-standard payment processor used by millions of businesses. We never store your card details.",
  },
]

function PricingContent() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        trackEvent('checkout_started', { source: 'pricing_page' })
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setChecking(false)

      // Auto-trigger checkout if redirected back after OAuth login
      if (user && searchParams.get('checkout') === '1') {
        handleCheckout()
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBuyNow = async () => {
    if (checking || loading) return

    if (!user) {
      const supabase = createSupabaseBrowserClient()
      trackEvent('buy_now_clicked', { source: 'pricing_page', auth_state: 'unauthenticated' })
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/pricing?checkout=1')}`,
        },
      })
    } else {
      trackEvent('buy_now_clicked', { source: 'pricing_page', auth_state: 'authenticated' })
      await handleCheckout()
    }
  }

  const buttonLabel = loading
    ? 'Redirecting to checkout…'
    : checking
    ? 'Loading…'
    : 'Buy now — $5'

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-14">
        {/* Hero */}
        <section className="border-b border-[#E5E7EB] bg-[#FAFAFA] py-20">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <div className="inline-block rounded-full border border-[#E5E7EB] bg-white px-4 py-1.5 text-xs font-medium text-[#6B7280]">
              Simple, honest pricing
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#0A0A0A] sm:text-5xl">
              One price. Everything included.
            </h1>
            <p className="mt-4 text-lg text-[#6B7280]">
              No subscriptions, no hidden fees. Pay once, use forever.
            </p>
          </div>
        </section>

        {/* Pricing card */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-md">
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
                {/* Price */}
                <div className="text-center">
                  <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                    Lifetime License
                  </div>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-6xl font-extrabold text-[#0A0A0A]">$5</span>
                    <span className="text-lg text-[#9CA3AF]">one-time</span>
                  </div>
                  <p className="mt-2 text-sm text-[#6B7280]">
                    No subscription. No renewal. Just yours.
                  </p>
                </div>

                {/* Features list */}
                <ul className="mt-8 space-y-3">
                  {FEATURES.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#374151]">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="mt-0.5 shrink-0 text-[#0A0A0A]"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Error message */}
                {error && (
                  <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={handleBuyNow}
                  disabled={loading || checking}
                  className="mt-8 w-full rounded-xl bg-[#0A0A0A] py-3.5 text-center font-semibold text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {buttonLabel}
                </button>

                {/* Auth hint */}
                {user ? (
                  <p className="mt-3 text-center text-xs text-[#9CA3AF]">
                    Signed in as {user.email}
                  </p>
                ) : (
                  <p className="mt-3 text-center text-xs text-[#9CA3AF]">
                    Sign in with Google to complete purchase
                  </p>
                )}
              </div>

              {/* Trust signals */}
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[#9CA3AF]">
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="22" height="18" rx="2" />
                    <polyline points="1 9 23 9" />
                  </svg>
                  Stripe secured
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Secure payment
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Instant activation
                </span>
              </div>

              {/* Already have a license */}
              <p className="mt-6 text-center text-xs text-[#9CA3AF]">
                Already purchased?{' '}
                <Link href="/login" className="underline hover:text-[#6B7280]">
                  Sign in to the app
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-[#E5E7EB] bg-[#FAFAFA] py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-2xl font-bold text-[#0A0A0A]">Frequently asked questions</h2>
            <div className="mt-8 space-y-6">
              {FAQ.map(({ q, a }) => (
                <div key={q} className="border-b border-[#E5E7EB] pb-6 last:border-0">
                  <h3 className="font-semibold text-[#0A0A0A]">{q}</h3>
                  <p className="mt-2 text-sm text-[#6B7280]">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] text-[#9CA3AF]">
          Loading…
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  )
}
