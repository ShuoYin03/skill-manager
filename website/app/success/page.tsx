'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
      <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F3F4F6]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#0A0A0A]">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#0A0A0A]">You&apos;re all set!</h1>
        <p className="mt-3 text-[#6B7280] leading-relaxed">
          Your Skilly license is now active. Open the desktop app and sign in
          with the same Google account to unlock full access.
        </p>

        {sessionId && (
          <p className="mt-4 text-xs text-[#9CA3AF]">
            Session: {sessionId.slice(0, 16)}...
          </p>
        )}

        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-[#0A0A0A] px-8 py-3 font-semibold text-white transition hover:bg-[#333]"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] text-[#9CA3AF]">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
