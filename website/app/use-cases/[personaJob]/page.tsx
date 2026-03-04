import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingArticlePage } from '@/components/MarketingArticlePage'
import { USE_CASE_PAGES, getPageBySlug } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

interface UseCasePageProps {
  params: Promise<{ personaJob: string }>
}

export function generateStaticParams() {
  return USE_CASE_PAGES.map((entry) => ({ personaJob: entry.slug }))
}

export async function generateMetadata({
  params
}: UseCasePageProps): Promise<Metadata> {
  const { personaJob } = await params
  const page = getPageBySlug(USE_CASE_PAGES, personaJob)

  if (!page) {
    return { title: 'Not Found' }
  }

  return {
    title: `${page.title} | Skilly Use Cases`,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: `${SITE_URL}/use-cases/${page.slug}`
    }
  }
}

export default async function UseCasePage({ params }: UseCasePageProps) {
  const { personaJob } = await params
  const page = getPageBySlug(USE_CASE_PAGES, personaJob)

  if (!page) {
    notFound()
  }

  return (
    <MarketingArticlePage
      page={page}
      pathname={`/use-cases/${page.slug}`}
      breadcrumbLabel="Use Cases"
    />
  )
}
