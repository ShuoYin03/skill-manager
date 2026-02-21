import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Repo Launcher — Open any repo in one keystroke',
  description:
    'A Spotlight-like launcher for quickly opening repos in your editor. Global hotkey, fuzzy search, multi-editor support. macOS, Windows, Linux.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
