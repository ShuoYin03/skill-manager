import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { PageViewTracker } from '@/components/PageViewTracker'
import { SITE_URL, SKILLY_ONE_LINER } from '@/lib/site'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Skilly — Manage AI skills across all your projects',
  description: `${SKILLY_ONE_LINER} Works with Claude, Cursor, Windsurf, Codex, and GitHub Copilot.`,
  alternates: {
    canonical: SITE_URL
  },
  openGraph: {
    title: 'Skilly — AI Skills Workflow for Developers',
    description: SKILLY_ONE_LINER,
    url: SITE_URL,
    siteName: 'Skilly',
    type: 'website'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${dmSans.className} bg-[#FAFAFA] text-[#0A0A0A] antialiased`}>
        <PageViewTracker />
        {children}
      </body>
    </html>
  )
}
