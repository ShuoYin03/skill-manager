import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 text-sm text-[#9CA3AF] sm:flex-row">
        <p>&copy; {new Date().getFullYear()} Skilly. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/blog" className="transition hover:text-[#6B7280]">
            Blog
          </Link>
          <Link href="/guides/skilly-glossary" className="transition hover:text-[#6B7280]">
            Glossary
          </Link>
          <Link href="/vs/manual-setup" className="transition hover:text-[#6B7280]">
            Comparison
          </Link>
        </div>
      </div>
    </footer>
  )
}
