'use client'

import { useEffect, useState } from 'react'

type Status = 'redirecting' | 'done'

export default function AuthSuccessPage() {
  const [status, setStatus] = useState<Status>('redirecting')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const at = params.get('at')
    const rt = params.get('rt')

    if (at && rt) {
      // Deep-link back into the Electron app with the session tokens
      window.location.href =
        `skilly://auth/callback#access_token=${at}&refresh_token=${rt}&token_type=bearer`
    }

    // Show "close tab" state after 1 s (whether deep-link fired or not)
    const t = setTimeout(() => setStatus('done'), 1000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm text-center">

          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] mx-auto mb-5">
            {status === 'redirecting' ? (
              <svg
                className="animate-spin text-[#6B7280]"
                width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg
                width="22" height="22" viewBox="0 0 24 24"
                fill="none" stroke="#16A34A" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>

          <h1 className="text-[#0A0A0A] text-[18px] font-semibold tracking-tight mb-2">
            {status === 'redirecting' ? 'Signing you in…' : "You're signed in"}
          </h1>

          <p className="text-[#6B7280] text-[14px] leading-relaxed">
            {status === 'redirecting'
              ? 'Returning you to Skilly…'
              : 'You can close this tab and return to the app.'}
          </p>

          {status === 'done' && (
            <div className="mt-6 pt-5 border-t border-[#F3F4F6]">
              <button
                onClick={() => window.close()}
                className="text-[13px] text-[#6B7280] hover:text-[#0A0A0A] transition-colors cursor-pointer"
              >
                Close this tab
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[12px] text-[#9CA3AF] mt-5">Skilly</p>
      </div>
    </div>
  )
}
