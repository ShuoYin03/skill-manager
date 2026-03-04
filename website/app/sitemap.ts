import type { MetadataRoute } from 'next'
import {
  BLOG_POSTS,
  GUIDE_PAGES,
  TEMPLATE_PAGES,
  USE_CASE_PAGES,
  VERSUS_PAGES
} from '@/lib/content'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9
    }
  ]

  const blogPages = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }))

  const guidePages = GUIDE_PAGES.map((page) => ({
    url: `${SITE_URL}/guides/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7
  }))

  const versusPages = VERSUS_PAGES.map((page) => ({
    url: `${SITE_URL}/vs/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7
  }))

  const useCasePages = USE_CASE_PAGES.map((page) => ({
    url: `${SITE_URL}/use-cases/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.65
  }))

  const templatePages = TEMPLATE_PAGES.map((page) => ({
    url: `${SITE_URL}/templates/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.65
  }))

  return [
    ...staticPages,
    ...blogPages,
    ...guidePages,
    ...versusPages,
    ...useCasePages,
    ...templatePages
  ]
}
