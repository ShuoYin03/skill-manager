import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingArticlePage } from '@/components/MarketingArticlePage'
import { GUIDE_PAGES, getPageBySlug } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

interface GuidePageProps {
  params: Promise<{ topic: string }>
}

export function generateStaticParams() {
  return GUIDE_PAGES.map((guide) => ({ topic: guide.slug }))
}

export async function generateMetadata({
  params
}: GuidePageProps): Promise<Metadata> {
  const { topic } = await params
  const page = getPageBySlug(GUIDE_PAGES, topic)

  if (!page) {
    return { title: 'Not Found' }
  }

  return {
    title: `${page.title} | Skilly Guides`,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: `${SITE_URL}/guides/${page.slug}`
    }
  }
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { topic } = await params
  const page = getPageBySlug(GUIDE_PAGES, topic)

  if (!page) {
    notFound()
  }

  return (
    <MarketingArticlePage
      page={page}
      pathname={`/guides/${page.slug}`}
      breadcrumbLabel="Guides"
    />
  )
}
