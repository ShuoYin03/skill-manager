import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { net } from 'electron'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export interface SkillRow {
  slug: string
  owner: string
  repo: string
  skillId: string
  name: string
  content: string | null
  contentFetchedAt: string | null
  contentError: string | null
  createdAt: string
  updatedAt: string
  installs: number
}

// PostgreSQL column names are snake_case
interface DBSkillRow {
  slug: string
  owner: string
  repo: string
  skill_id: string
  name: string
  content: string | null
  content_fetched_at: string | null
  content_error: string | null
  created_at: string
  updated_at: string
  installs: number
}

function toSkillRow(row: DBSkillRow): SkillRow {
  return {
    slug: row.slug,
    owner: row.owner,
    repo: row.repo,
    skillId: row.skill_id,
    name: row.name,
    content: row.content,
    contentFetchedAt: row.content_fetched_at,
    contentError: row.content_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    installs: row.installs ?? 0
  }
}

let _anonClient: SupabaseClient | null = null

function getAnonClient(): SupabaseClient {
  if (!_anonClient) {
    // Use Electron's net.fetch (Chromium network stack) to correctly validate
    // SSL certificates via the system CA store. Node.js native fetch (undici)
    // fails with SELF_SIGNED_CERT_IN_CHAIN in packaged Electron apps.
    _anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { fetch: net.fetch.bind(net) as typeof fetch }
    })
  }
  return _anonClient
}

// ─── In-memory cache ─────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  expiry: number
}

const _cache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Tracks whether the installs column exists. Set to false on first 42703 error.
let _installsColumnReady = true

function getCached<T>(key: string): T | null {
  const entry = _cache.get(key) as CacheEntry<T> | undefined
  if (entry && entry.expiry > Date.now()) return entry.data
  return null
}

function setCached<T>(key: string, data: T): void {
  _cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS })
}

export function createServiceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set. Add it to your .env file.')
  return createClient(SUPABASE_URL, key)
}

// ─── Write operations (require service client) ───────────────────────────────

export async function upsertSkill(
  skill: { slug: string; owner: string; repo: string; skillId: string; name: string; installs?: number },
  client: SupabaseClient
): Promise<void> {
  const { error } = await client.from('marketplace_skills').upsert(
    {
      slug: skill.slug,
      owner: skill.owner,
      repo: skill.repo,
      skill_id: skill.skillId,
      name: skill.name,
      installs: skill.installs ?? 0,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'slug' }
  )
  if (error) throw error
}

export async function upsertSkills(
  skills: Array<{ slug: string; owner: string; repo: string; skillId: string; name: string; installs?: number }>,
  client: SupabaseClient
): Promise<void> {
  if (skills.length === 0) return
  const rows = skills.map((s) => ({
    slug: s.slug,
    owner: s.owner,
    repo: s.repo,
    skill_id: s.skillId,
    name: s.name,
    installs: s.installs ?? 0,
    updated_at: new Date().toISOString()
  }))
  const { error } = await client.from('marketplace_skills').upsert(rows, { onConflict: 'slug' })
  if (error) throw error
}

export async function updateSkillContent(
  slug: string,
  content: string | null,
  contentError: string | null,
  client: SupabaseClient
): Promise<void> {
  const { error } = await client
    .from('marketplace_skills')
    .update({
      content,
      content_error: contentError,
      content_fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('slug', slug)
  if (error) throw error
}

export async function setMetadata(key: string, value: string, client: SupabaseClient): Promise<void> {
  const { error } = await client
    .from('marketplace_metadata')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw error
}

// ─── Read operations (use anon client) ───────────────────────────────────────

export async function getSkillsWithoutContent(): Promise<SkillRow[]> {
  const client = getAnonClient()
  const PAGE_SIZE = 1000
  const allSkills: SkillRow[] = []
  let from = 0

  while (true) {
    const { data, error } = await client
      .from('marketplace_skills')
      .select('*')
      .is('content', null)
      .is('content_error', null)
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) break
    allSkills.push(...(data as DBSkillRow[]).map(toSkillRow))
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return allSkills
}

export async function getSkillBySlug(slug: string): Promise<SkillRow | null> {
  const client = getAnonClient()
  const { data, error } = await client
    .from('marketplace_skills')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data ? toSkillRow(data as DBSkillRow) : null
}

export async function searchSkills(params: {
  query?: string
  tags?: string[]
  author?: string
  limit: number
  offset: number
}): Promise<{ skills: SkillRow[]; total: number }> {
  const cacheKey = `search:${JSON.stringify(params)}`
  const cached = getCached<{ skills: SkillRow[]; total: number }>(cacheKey)
  if (cached) return cached

  const client = getAnonClient()

  // Build the Supabase query, optionally including the installs column for ordering.
  // Omits `content` (large markdown) — only needed in detail view via getSkillBySlug.
  const buildQuery = (withInstalls: boolean) => {
    const cols = withInstalls
      ? 'slug,owner,repo,skill_id,name,created_at,updated_at,installs'
      : 'slug,owner,repo,skill_id,name,created_at,updated_at'
    let q = client.from('marketplace_skills').select(cols, { count: 'exact' })

    if (params.query) {
      const esc = params.query.replace(/%/g, '\\%').replace(/_/g, '\\_')
      q = q.or(`name.ilike.%${esc}%,skill_id.ilike.%${esc}%,owner.ilike.%${esc}%,repo.ilike.%${esc}%`)
    }
    if (params.tags && params.tags.length > 0) q = q.in('repo', params.tags)
    if (params.author) q = q.eq('owner', params.author)
    return q
  }

  let q = buildQuery(_installsColumnReady)
  if (_installsColumnReady) q = q.order('installs', { ascending: false, nullsFirst: false })

  const { data, count, error } = await q.range(params.offset, params.offset + params.limit - 1)

  if (error) {
    if (_installsColumnReady && (error as { code?: string }).code === '42703') {
      // installs column not yet added — retry without ordering and log a hint
      _installsColumnReady = false
      console.warn('[marketplace] installs column missing — run ALTER TABLE to enable popularity ordering')
      const { data: d2, count: c2, error: e2 } = await buildQuery(false)
        .range(params.offset, params.offset + params.limit - 1)
      if (e2) throw e2
      const result = { skills: (d2 ?? []).map((r) => toSkillRow(r as DBSkillRow)), total: c2 ?? 0 }
      setCached(cacheKey, result)
      return result
    }
    throw error
  }

  const result = {
    skills: (data ?? []).map((r) => toSkillRow(r as DBSkillRow)),
    total: count ?? 0
  }
  setCached(cacheKey, result)
  return result
}

export async function getFilterStats(): Promise<{
  tags: Array<{ name: string; count: number }>
  authors: Array<{ name: string; count: number }>
}> {
  const cached = getCached<{ tags: Array<{ name: string; count: number }>; authors: Array<{ name: string; count: number }> }>('filter-stats')
  if (cached) return cached

  const client = getAnonClient()
  const { data, error } = await client.rpc('get_marketplace_filter_stats')

  if (error) throw error

  let result: { tags: Array<{ name: string; count: number }>; authors: Array<{ name: string; count: number }> }
  if (data && typeof data === 'object') {
    const d = data as { tags?: Array<{ name: string; count: number }>; authors?: Array<{ name: string; count: number }> }
    result = { tags: d.tags ?? [], authors: d.authors ?? [] }
  } else {
    result = { tags: [], authors: [] }
  }

  setCached('filter-stats', result)
  return result
}

export async function getMetadata(key: string): Promise<string | null> {
  const client = getAnonClient()
  const { data, error } = await client
    .from('marketplace_metadata')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (error) throw error
  return (data as { value: string } | null)?.value ?? null
}

export async function getSkillCount(): Promise<number> {
  const client = getAnonClient()
  const { count, error } = await client
    .from('marketplace_skills')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count ?? 0
}

export async function getAllSlugs(): Promise<string[]> {
  const client = getAnonClient()
  const PAGE_SIZE = 1000
  const allSlugs: string[] = []
  let from = 0

  while (true) {
    const { data, error } = await client
      .from('marketplace_skills')
      .select('slug')
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) break
    allSlugs.push(...(data as { slug: string }[]).map((r) => r.slug))
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return allSlugs
}

// No-op for backward compatibility (Supabase HTTP client has no persistent connection)
export function closeDb(): void {}
