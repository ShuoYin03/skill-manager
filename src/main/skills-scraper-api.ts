import { upsertSkill, setMetadata, getMetadata } from './skills-db'

interface APISearchResponse {
  query: string
  searchType: string
  skills: Array<{
    id: string // "vercel-labs/skills/find-skills"
    skillId: string // "find-skills"
    name: string // "Find Skills"
    installs: number
    source: string
  }>
}

interface APIScrapeProgress {
  lastQuery: string
  completedQueries: string[]
  totalDiscovered: number
  noNewSkillsCount: number
  lastUpdated: string
}

const API_CONFIG = {
  BASE_URL: 'https://skills.sh/api/search',
  CONCURRENCY: 3,
  BATCH_DELAY_MS: 500,
  QUERY_LIMIT: 100,
  MAX_OFFSET: 10000,
  CONVERGENCE_THRESHOLD: 50,
  MIN_QUERIES: 100
}

/**
 * Generate all query strings for enumeration
 * Note: API requires minimum 2 characters, and offset doesn't work reliably for generic queries
 * Using two-character combinations to enumerate all skills
 */
function generateQueries(): string[] {
  const queries: string[] = []

  // Generate all two-character combinations (aa-zz)
  for (let i = 97; i <= 122; i++) {
    for (let j = 97; j <= 122; j++) {
      queries.push(String.fromCharCode(i) + String.fromCharCode(j))
    }
  }

  return queries
}

/**
 * Fetch skills for a single query with pagination
 */
async function fetchSkillsForQuery(
  query: string,
  discoveredSlugs: Set<string>
): Promise<{ newSkills: number; totalResults: number }> {
  let offset = 0
  let newSkills = 0
  let totalResults = 0

  while (offset < API_CONFIG.MAX_OFFSET) {
    const url = `${API_CONFIG.BASE_URL}?q=${encodeURIComponent(query)}&limit=${API_CONFIG.QUERY_LIMIT}&offset=${offset}`

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) {
        console.warn(`API error for query "${query}" offset ${offset}: ${res.status}`)
        break
      }

      const data = (await res.json()) as APISearchResponse

      if (!data.skills || data.skills.length === 0) {
        break // No more results for this query
      }

      totalResults += data.skills.length

      // Parse and upsert skills
      for (const skill of data.skills) {
        const parts = skill.id.split('/')
        if (parts.length !== 3) continue

        const [owner, repo, skillId] = parts
        const slug = skill.id

        // Check if this is a new discovery
        if (!discoveredSlugs.has(slug)) {
          discoveredSlugs.add(slug)
          newSkills++

          // Insert into database
          upsertSkill({
            slug,
            owner,
            repo,
            skillId,
            name: skill.name || skillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          })
        }
      }

      // Move to next page
      offset += API_CONFIG.QUERY_LIMIT

      // If we got fewer results than the limit, we've reached the end
      if (data.skills.length < API_CONFIG.QUERY_LIMIT) {
        break
      }
    } catch (err) {
      console.error(`Failed to fetch query "${query}" offset ${offset}:`, err)
      break
    }
  }

  return { newSkills, totalResults }
}

/**
 * Load progress from database
 */
function loadProgress(): APIScrapeProgress | null {
  const progressJson = getMetadata('apiScrapeProgress')
  if (!progressJson) return null

  try {
    return JSON.parse(progressJson) as APIScrapeProgress
  } catch {
    return null
  }
}

/**
 * Save progress to database
 */
function saveProgress(progress: APIScrapeProgress): void {
  setMetadata('apiScrapeProgress', JSON.stringify(progress))
}

/**
 * Main API-based scraper function
 */
export async function scrapeAllSkillsViaAPI(
  onProgress?: (
    current: number,
    total: number,
    phase: string,
    stats: { discovered: number; newInBatch: number }
  ) => void
): Promise<{ totalDiscovered: number; queries: number }> {
  const queries = generateQueries()
  const discoveredSlugs = new Set<string>()

  // Load progress if resuming
  const savedProgress = loadProgress()
  let noNewSkillsCount = 0

  if (savedProgress) {
    console.log(`Resuming from previous scrape (${savedProgress.totalDiscovered} skills discovered)`)
    // Filter out completed queries
    const remaining = queries.filter((q) => !savedProgress.completedQueries.includes(q))
    queries.length = 0
    queries.push(...remaining)

    // Pre-populate discovered set (approximate)
    noNewSkillsCount = savedProgress.noNewSkillsCount || 0
  }

  const totalQueries = queries.length
  let completedQueries: string[] = savedProgress?.completedQueries || []

  onProgress?.(0, totalQueries, 'Starting API scrape...', { discovered: 0, newInBatch: 0 })

  // Process queries in batches for controlled concurrency
  for (let i = 0; i < queries.length; i += API_CONFIG.CONCURRENCY) {
    const batch = queries.slice(i, i + API_CONFIG.CONCURRENCY)

    // Fetch batch in parallel
    const results = await Promise.all(batch.map((query) => fetchSkillsForQuery(query, discoveredSlugs)))

    // Aggregate results
    let batchNewSkills = 0
    for (const result of results) {
      batchNewSkills += result.newSkills
    }

    // Update no-new-skills counter
    if (batchNewSkills === 0) {
      noNewSkillsCount++
    } else {
      noNewSkillsCount = 0 // Reset when we find new skills
    }

    // Update completed queries
    completedQueries.push(...batch)

    // Save progress
    const progress: APIScrapeProgress = {
      lastQuery: batch[batch.length - 1],
      completedQueries,
      totalDiscovered: discoveredSlugs.size,
      noNewSkillsCount,
      lastUpdated: new Date().toISOString()
    }
    saveProgress(progress)

    // Report progress
    const current = i + batch.length
    onProgress?.(current, totalQueries, `Query: "${batch[batch.length - 1]}"`, {
      discovered: discoveredSlugs.size,
      newInBatch: batchNewSkills
    })

    // Check convergence (stop if not finding new skills)
    if (current > API_CONFIG.MIN_QUERIES && noNewSkillsCount >= API_CONFIG.CONVERGENCE_THRESHOLD) {
      console.log(
        `Convergence detected after ${current} queries (${noNewSkillsCount} consecutive queries with no new skills)`
      )
      break
    }

    // Rate limiting delay
    if (i + API_CONFIG.CONCURRENCY < queries.length) {
      await new Promise((r) => setTimeout(r, API_CONFIG.BATCH_DELAY_MS))
    }
  }

  // Update final metadata
  setMetadata('apiLastScraped', new Date().toISOString())
  setMetadata('apiTotalDiscovered', String(discoveredSlugs.size))

  return {
    totalDiscovered: discoveredSlugs.size,
    queries: completedQueries.length
  }
}
