import Link from 'next/link'
import { JsonLd } from '@/components/JsonLd'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import type { MarketingContentPage } from '@/lib/content'
import { SITE_URL } from '@/lib/site'
import { buildUtmUrl } from '@/lib/utm'

interface MarketingArticlePageProps {
  page: MarketingContentPage
  pathname: string
  breadcrumbLabel: string
}

export function MarketingArticlePage({
  page,
  pathname,
  breadcrumbLabel
}: MarketingArticlePageProps) {
  const canonicalUrl = `${SITE_URL}${pathname}`

  const articleSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.description,
    datePublished: page.publishedAt,
    dateModified: page.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'Skilly'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Skilly'
    },
    mainEntityOfPage: canonicalUrl,
    keywords: page.keywords.join(', ')
  }

  const breadcrumbSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: breadcrumbLabel,
        item: canonicalUrl
      }
    ]
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <JsonLd id={`article-schema-${page.slug}`} data={articleSchema} />
      <JsonLd id={`breadcrumb-schema-${page.slug}`} data={breadcrumbSchema} />
      <Navbar />

      <article className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <header className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
          <p className="text-sm text-[#9CA3AF]">
            Published {page.publishedAt} · Updated {page.updatedAt}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0A0A0A] sm:text-4xl">
            {page.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#6B7280]">
            {page.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {page.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1 text-xs text-[#6B7280]"
              >
                {keyword}
              </span>
            ))}
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white p-8">
          <h2 className="text-xl font-semibold text-[#0A0A0A]">TL;DR</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#6B7280]">
            {page.tldr.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {page.sections.map((section) => (
          <section
            key={section.heading}
            className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white p-8"
          >
            <h2 className="text-xl font-semibold text-[#0A0A0A]">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 text-sm leading-relaxed text-[#6B7280]">
                {paragraph}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#6B7280]">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white p-8">
          <h2 className="text-xl font-semibold text-[#0A0A0A]">Q&A</h2>
          <div className="mt-4 space-y-6">
            {page.qa.map((item) => (
              <div key={item.question}>
                <h3 className="text-base font-semibold text-[#0A0A0A]">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white p-8">
          <h2 className="text-xl font-semibold text-[#0A0A0A]">When to use Skilly</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#6B7280]">
            {page.whenToUse.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-6">
            <Link
              href={buildUtmUrl('/#download', {
                source: 'website',
                medium: 'organic',
                content: `${page.slug}_cta`
              })}
              className="inline-flex rounded-lg bg-[#0A0A0A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#333]"
            >
              Download Skilly Free Trial
            </Link>
          </div>
        </section>
      </article>
      <Footer />
    </main>
  )
}
