'use client'

import { useEffect, useState } from 'react'

export default function AuthSuccessPage() {
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const at = params.get('at')
    const rt = params.get('rt')

    if (at && rt) {
      const url = `skilly://auth/callback#access_token=${at}&refresh_token=${rt}&token_type=bearer`
      setDeepLinkUrl(url)

      // Best-effort auto-redirect (works in some environments)
      window.location.href = url
    }

    // Show the manual button after a short delay as fallback
    const t = setTimeout(() => setShowFallback(true), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm text-center">

          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] mx-auto mb-5">
            <svg
              width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="#16A34A" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1 className="text-[#0A0A0A] text-[18px] font-semibold tracking-tight mb-2">
            You&apos;re signed in
          </h1>

          <p className="text-[#6B7280] text-[14px] leading-relaxed">
            Skilly has been updated. You can close this tab.
          </p>

          {/* Fallback button — shown if auto-redirect didn't fire */}
          {showFallback && deepLinkUrl && (
            <a
              href={deepLinkUrl}
              className="mt-5 inline-block w-full py-2.5 px-4 rounded-xl bg-[#0A0A0A] text-white text-[14px] font-medium tracking-tight cursor-pointer hover:bg-[#222] transition-colors"
            >
              Open Skilly
            </a>
          )}
        </div>

        <p className="text-center text-[12px] text-[#9CA3AF] mt-5">Skilly</p>
      </div>
    </div>
  )
}
