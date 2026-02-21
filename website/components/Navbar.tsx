'use client'

import Link from 'next/link'

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-gray-950/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          Repo Launcher
        </Link>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-gray-400 transition hover:text-white">Features</a>
          <a href="#pricing" className="text-sm text-gray-400 transition hover:text-white">Pricing</a>
          <a href="#download" className="text-sm text-gray-400 transition hover:text-white">Download</a>
          <Link
            href="/login"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
          >
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  )
}
