import type { Metadata } from 'next'
import Link from 'next/link'
import { BLOG_POSTS } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Skilly Blog | AI Coding Skills Strategy and Workflows',
  description:
    'Search-first guides on AI coding skills management, cross-tool workflows, and prompt/rules operations.',
  alternates: {
    canonical: `${SITE_URL}/blog`
  }
}

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-24 pb-16">
      <section className="mx-auto max-w-5xl px-6">
        <h1 className="text-4xl font-bold tracking-tight text-[#0A0A0A]">
          Skilly Blog
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#6B7280]">
          Searchable and shareable content for developers who want a repeatable AI
          coding workflow.
        </p>

        <div className="mt-10 grid gap-4">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="rounded-xl border border-[#E5E7EB] bg-white p-6 transition hover:border-[#D1D5DB] hover:shadow-sm"
            >
              <p className="text-xs text-[#9CA3AF]">{post.publishedAt}</p>
              <h2 className="mt-2 text-xl font-semibold text-[#0A0A0A]">{post.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                {post.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
