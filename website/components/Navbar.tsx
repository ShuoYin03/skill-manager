'use client'

import Link from 'next/link'

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-[#E5E7EB] bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-base font-bold text-[#0A0A0A]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Skilly
        </Link>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-[#6B7280] transition hover:text-[#0A0A0A]">Features</a>
          <a href="#pricing" className="text-sm text-[#6B7280] transition hover:text-[#0A0A0A]">Pricing</a>
          <a href="#download" className="text-sm text-[#6B7280] transition hover:text-[#0A0A0A]">Download</a>
          <Link
            href="/login"
            className="rounded-lg bg-[#0A0A0A] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#333]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  )
}
