import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingArticlePage } from '@/components/MarketingArticlePage'
import { TEMPLATE_PAGES, getPageBySlug } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

interface TemplatePageProps {
  params: Promise<{ workflow: string }>
}

export function generateStaticParams() {
  return TEMPLATE_PAGES.map((entry) => ({ workflow: entry.slug }))
}

export async function generateMetadata({
  params
}: TemplatePageProps): Promise<Metadata> {
  const { workflow } = await params
  const page = getPageBySlug(TEMPLATE_PAGES, workflow)

  if (!page) {
    return { title: 'Not Found' }
  }

  return {
    title: `${page.title} | Skilly Templates`,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: `${SITE_URL}/templates/${page.slug}`
    }
  }
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const { workflow } = await params
  const page = getPageBySlug(TEMPLATE_PAGES, workflow)

  if (!page) {
    notFound()
  }

  return (
    <MarketingArticlePage
      page={page}
      pathname={`/templates/${page.slug}`}
      breadcrumbLabel="Templates"
    />
  )
}
