import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingArticlePage } from '@/components/MarketingArticlePage'
import { VERSUS_PAGES, getPageBySlug } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

interface VersusPageProps {
  params: Promise<{ alternative: string }>
}

export function generateStaticParams() {
  return VERSUS_PAGES.map((entry) => ({ alternative: entry.slug }))
}

export async function generateMetadata({
  params
}: VersusPageProps): Promise<Metadata> {
  const { alternative } = await params
  const page = getPageBySlug(VERSUS_PAGES, alternative)

  if (!page) {
    return { title: 'Not Found' }
  }

  return {
    title: `${page.title} | Skilly Comparison`,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: `${SITE_URL}/vs/${page.slug}`
    }
  }
}

export default async function VersusPage({ params }: VersusPageProps) {
  const { alternative } = await params
  const page = getPageBySlug(VERSUS_PAGES, alternative)

  if (!page) {
    notFound()
  }

  return (
    <MarketingArticlePage
      page={page}
      pathname={`/vs/${page.slug}`}
      breadcrumbLabel="Comparisons"
    />
  )
}
