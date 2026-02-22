import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import { upsertSkill, getSkillsWithoutContent, updateSkillContent, setMetadata } from './skills-db'

interface SkillIndexEntry {
  slug: string    // "owner/repo/skillId"
  owner: string
  repo: string
  skillId: string
  name: string
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

export async function scrapeSkillsToDb(
  onProgress?: (done: number, total: number, phase: string) => void
): Promise<{ count: number }> {
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

  // Insert into database
  for (const skill of unique) {
    upsertSkill(skill)
  }

  // Update metadata
  setMetadata('lastScraped', new Date().toISOString())
  setMetadata('count', String(unique.length))

  return { count: unique.length }
}

export async function batchFetchSkillContent(
  onProgress?: (current: number, total: number, slug: string) => void
): Promise<{ successful: number; failed: number }> {
  const CONCURRENCY = 5
  const BATCH_DELAY_MS = 200

  const skillsToFetch = getSkillsWithoutContent()
  const total = skillsToFetch.length

  let successful = 0
  let failed = 0

  for (let i = 0; i < skillsToFetch.length; i += CONCURRENCY) {
    const batch = skillsToFetch.slice(i, i + CONCURRENCY)

    // Fetch 5 skills in parallel
    await Promise.all(
      batch.map(async (skill) => {
        try {
          const content = await fetchSkillContent(skill.slug)
          updateSkillContent(skill.slug, content, null)
          successful++
          onProgress?.(i + batch.indexOf(skill), total, skill.slug)
        } catch (err) {
          updateSkillContent(skill.slug, null, String(err))
          failed++
        }
      })
    )

    // Rate limit delay
    if (i + CONCURRENCY < skillsToFetch.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  setMetadata('contentFetchedAt', new Date().toISOString())

  return { successful, failed }
}

/**
 * Convert HTML to GitHub Flavored Markdown
 */
function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**'
  })

  // Add GitHub Flavored Markdown support (tables, strikethrough, etc.)
  turndown.use(gfm)

  // Custom rule for code blocks with syntax highlighting
  turndown.addRule('codeHighlight', {
    filter: (node) => {
      const el = node as unknown as { className?: string }
      return Boolean(
        node.nodeName === 'CODE' &&
        node.parentNode?.nodeName === 'PRE' &&
        el.className?.includes('language-')
      )
    },
    replacement: (content, node) => {
      const element = node as unknown as { className?: string }
      const language =
        element.className
          ?.split(' ')
          .find((cls: string) => cls.startsWith('language-'))
          ?.replace('language-', '') || ''

      return '\n```' + language + '\n' + content + '\n```\n'
    }
  })

  return turndown.turndown(html)
}

export async function fetchSkillContent(slug: string): Promise<string | null> {
  const parts = slug.split('/')
  if (parts.length < 3) return null
  const [owner, repo, skillId] = parts

  // STRATEGY 1: Direct GitHub raw URL (most reliable)
  const githubPatterns = [
    `https://raw.githubusercontent.com/${owner}/${repo}/main/${skillId}/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/master/${skillId}/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/${skillId}.md`
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
    } catch {
      /* continue */
    }
  }

  // STRATEGY 2: Extract from skills.sh HTML
  try {
    const res = await fetch(`https://skills.sh/${owner}/${repo}/${skillId}`, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'text/html', 'User-Agent': 'DesktopTool/1.0' }
    })

    if (res.ok) {
      const html = await res.text()

      // Look for prose wrapper containing all content
      const proseMatch = html.match(/<div[^>]*class="[^"]*prose[^"]*"[^>]*>([\s\S]+?)<\/div>\s*<\/div>/)

      if (proseMatch) {
        // Convert HTML to markdown using turndown
        const markdown = htmlToMarkdown(proseMatch[1])
        if (markdown.length > 50) return markdown.trim()
      }

      // Fallback: Look for raw GitHub URL in HTML
      const rawUrlMatch = html.match(/https:\/\/raw\.githubusercontent\.com\/[^\s"'<>]+\.md/)
      if (rawUrlMatch) {
        const contentRes = await fetch(rawUrlMatch[0], { signal: AbortSignal.timeout(10000) })
        if (contentRes.ok) {
          const text = await contentRes.text()
          if (text.length > 20 && !text.startsWith('<!DOCTYPE') && !text.startsWith('<html')) {
            return text
          }
        }
      }
    }
  } catch (err) {
    console.warn(`Failed to fetch from skills.sh: ${err}`)
  }

  // STRATEGY 3: Return placeholder
  const name = skillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return `# ${name}\n\nInstalled from skills.sh — ${slug}\n`
}
