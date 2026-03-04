import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingArticlePage } from '@/components/MarketingArticlePage'
import { BLOG_POSTS, getPageBySlug } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const page = getPageBySlug(BLOG_POSTS, slug)

  if (!page) {
    return {
      title: 'Not Found'
    }
  }

  return {
    title: `${page.title} | Skilly`,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: `${SITE_URL}/blog/${page.slug}`
    }
  }
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params
  const page = getPageBySlug(BLOG_POSTS, slug)

  if (!page) {
    notFound()
  }

  return (
    <MarketingArticlePage
      page={page}
      pathname={`/blog/${page.slug}`}
      breadcrumbLabel="Blog"
    />
  )
}
