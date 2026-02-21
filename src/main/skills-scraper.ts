import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'

export interface SkillIndexEntry {
  slug: string    // "owner/repo/skillId"
  owner: string
  repo: string
  skillId: string
  name: string
}

export interface SkillsCache {
  lastScraped: string
  count: number
  skills: SkillIndexEntry[]
}

function getCachePath(): string {
  return path.join(app.getPath('userData'), 'marketplace-cache.json')
}

export async function getSkillsCache(): Promise<SkillsCache | null> {
  try {
    const raw = await fs.readFile(getCachePath(), 'utf-8')
    return JSON.parse(raw) as SkillsCache
  } catch {
    return null
  }
}

function extractLocs(xml: string): string[] {
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g)
  return Array.from(matches).map((m) => m[1].trim())
}

function isSitemapIndex(xml: string): boolean {
  return xml.includes('<sitemapindex')
}

function parseSkillUrl(url: string): SkillIndexEntry | null {
  const match = url.match(/^https:\/\/skills\.sh\/([^/]+)\/([^/]+)\/([^/]+)\/?$/)
  if (!match) return null
  const [, owner, repo, skillId] = match
  // Skip non-skill path segments
  if (['sitemap', 'api', 'docs', 'blog', 'about', 'privacy', 'terms', 'audits'].includes(owner)) {
    return null
  }
  const name = skillId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return { slug: `${owner}/${repo}/${skillId}`, owner, repo, skillId, name }
}

async function fetchSitemapUrls(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) return []
    const xml = await res.text()
    return extractLocs(xml)
  } catch {
    return []
  }
}

export async function scrapeSkillsToCache(
  onProgress?: (done: number, total: number, phase: string) => void
): Promise<SkillsCache> {
  onProgress?.(0, 1, 'Fetching sitemap...')

  const rootRes = await fetch('https://skills.sh/sitemap.xml', {
    signal: AbortSignal.timeout(30000)
  })
  if (!rootRes.ok) throw new Error(`Failed to fetch sitemap: ${rootRes.status}`)
  const rootXml = await rootRes.text()

  let allUrls: string[] = []

  if (isSitemapIndex(rootXml)) {
    const childSitemapUrls = extractLocs(rootXml)
    const total = childSitemapUrls.length
    for (let i = 0; i < childSitemapUrls.length; i++) {
      onProgress?.(i, total, `Fetching sitemap ${i + 1} of ${total}...`)
      const urls = await fetchSitemapUrls(childSitemapUrls[i])
      allUrls.push(...urls)
    }
    onProgress?.(total, total, 'Parsing skills...')
  } else {
    allUrls = extractLocs(rootXml)
    onProgress?.(1, 1, 'Parsing skills...')
  }

  const entries: SkillIndexEntry[] = []
  for (const url of allUrls) {
    const entry = parseSkillUrl(url)
    if (entry) entries.push(entry)
  }

  // Deduplicate by slug
  const seen = new Set<string>()
  const unique = entries.filter((e) => {
    if (seen.has(e.slug)) return false
    seen.add(e.slug)
    return true
  })

  const cache: SkillsCache = {
    lastScraped: new Date().toISOString(),
    count: unique.length,
    skills: unique
  }

  await fs.writeFile(getCachePath(), JSON.stringify(cache), 'utf-8')

  return cache
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function extractSkillContentFromHtml(html: string): string | null {
  // Try to find a <pre> block with skill content
  const preMatch = html.match(/<pre[^>]*>([\s\S]+?)<\/pre>/i)
  if (preMatch) {
    // Strip inner tags (e.g. <code>)
    const stripped = preMatch[1].replace(/<[^>]+>/g, '')
    const decoded = decodeHtmlEntities(stripped).trim()
    if (decoded.length > 20) return decoded
  }
  return null
}

export async function fetchSkillContent(slug: string): Promise<string | null> {
  const parts = slug.split('/')
  if (parts.length < 3) return null
  const [owner, repo, skillId] = parts

  // 1. Try skills.sh page HTML
  try {
    const res = await fetch(`https://skills.sh/${owner}/${repo}/${skillId}`, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'text/html' }
    })
    if (res.ok) {
      const html = await res.text()
      const htmlContent = extractSkillContentFromHtml(html)
      if (htmlContent) {
        if (htmlContent.startsWith('http')) {
          // The <pre> block contains a URL reference — fetch the actual content
          try {
            const contentRes = await fetch(htmlContent, { signal: AbortSignal.timeout(10000) })
            if (contentRes.ok) {
              const text = await contentRes.text()
              if (text.length > 20 && !text.startsWith('<!DOCTYPE') && !text.startsWith('<html')) return text
            }
          } catch { /* fall through */ }
        } else {
          return htmlContent
        }
      }
      // Also try to extract a raw GitHub URL directly from the page HTML
      const rawUrlMatch = html.match(/https:\/\/raw\.githubusercontent\.com\/[^\s"'<>]+\.md/)
      if (rawUrlMatch) {
        try {
          const contentRes = await fetch(rawUrlMatch[0], { signal: AbortSignal.timeout(10000) })
          if (contentRes.ok) {
            const text = await contentRes.text()
            if (text.length > 20 && !text.startsWith('<!DOCTYPE') && !text.startsWith('<html')) return text
          }
        } catch { /* fall through */ }
      }
    }
  } catch { /* fall through */ }

  // 2. Try GitHub raw (common patterns)
  const githubPatterns = [
    `https://raw.githubusercontent.com/${owner}/${repo}/main/${skillId}/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/master/${skillId}/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/${skillId}.md`,
  ]

  for (const url of githubPatterns) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        const text = await res.text()
        if (text.length > 20 && !text.startsWith('<!DOCTYPE') && !text.startsWith('<html')) {
          return text
        }
      }
    } catch { /* continue */ }
  }

  // 3. Return a minimal placeholder
  const name = skillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return `# ${name}\n\nInstalled from skills.sh — ${slug}\n`
}
