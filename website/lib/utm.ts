import { SITE_URL } from '@/lib/site'

export const UTM_SOURCES = [
  'x',
  'reddit',
  'github',
  'devto',
  'hn',
  'ph',
  'linkedin',
  'hashnode',
  'website'
] as const

export const UTM_MEDIA = ['organic', 'post', 'comment', 'profile'] as const

export type UtmSource = (typeof UTM_SOURCES)[number]
export type UtmMedium = (typeof UTM_MEDIA)[number]

export interface UtmParams {
  source: UtmSource
  medium: UtmMedium
  campaign?: string
  content?: string
}

export function buildUtmUrl(path: string, params: UtmParams): string {
  const url = new URL(path, SITE_URL)

  url.searchParams.set('utm_source', params.source)
  url.searchParams.set('utm_medium', params.medium)
  url.searchParams.set('utm_campaign', params.campaign ?? 'launch_90d')

  if (params.content) {
    url.searchParams.set('utm_content', params.content)
  }

  return `${url.pathname}${url.search}${url.hash}`
}
