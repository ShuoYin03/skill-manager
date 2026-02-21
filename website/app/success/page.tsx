'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/80 p-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold">You&apos;re all set!</h1>
        <p className="mt-3 text-gray-400 leading-relaxed">
          Your Repo Launcher license is now active. Open the desktop app and sign in
          with the same Google account to unlock full access.
        </p>

        {sessionId && (
          <p className="mt-4 text-xs text-gray-600">
            Session: {sessionId.slice(0, 16)}...
          </p>
        )}

        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-blue-500 px-8 py-3 font-semibold text-white transition hover:bg-blue-400"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
