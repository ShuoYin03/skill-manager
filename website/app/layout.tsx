import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Skilly — Manage AI skills across all your projects',
  description:
    'Browse, install, and manage AI coding skills across all your projects. Works with Claude, Cursor, Windsurf, and more. macOS, Windows, Linux.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${dmSans.className} bg-[#FAFAFA] text-[#0A0A0A] antialiased`}>
        {children}
      </body>
    </html>
  )
}
