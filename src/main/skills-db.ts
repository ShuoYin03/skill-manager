import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'

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
}

function getDbPath(): string {
  // Use project root's data folder
  // app.getAppPath() returns the app's root directory
  const appPath = app.getAppPath()

  // In development, appPath is the project root
  // In production (packaged), we still want to use a 'data' folder relative to the app
  const projectRoot = appPath.endsWith('app.asar')
    ? path.dirname(path.dirname(appPath)) // Go up from app.asar/out to project root
    : appPath // Development: use app path directly

  const dbPath = path.join(projectRoot, 'data', 'marketplace.db')
  console.log('[skills-db] Database path:', dbPath)
  return dbPath
}

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = getDbPath()
    const dbDir = path.dirname(dbPath)

    // Ensure the directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    db = new Database(dbPath)
    db.pragma('journal_mode = WAL') // Better concurrency
    initDb(db)
  }
  return db
}

function initDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      slug TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      skillId TEXT NOT NULL,
      name TEXT NOT NULL,
      content TEXT,
      contentFetchedAt TEXT,
      contentError TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_skills_owner ON skills(owner);
    CREATE INDEX IF NOT EXISTS idx_skills_repo ON skills(repo);
    CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);

    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

// Insert or update skill metadata (from sitemap)
export function upsertSkill(skill: {
  slug: string
  owner: string
  repo: string
  skillId: string
  name: string
}): void {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO skills (slug, owner, repo, skillId, name)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      owner = excluded.owner,
      repo = excluded.repo,
      skillId = excluded.skillId,
      name = excluded.name,
      updatedAt = CURRENT_TIMESTAMP
  `)
  stmt.run(skill.slug, skill.owner, skill.repo, skill.skillId, skill.name)
}

// Update skill content after fetching
export function updateSkillContent(slug: string, content: string | null, error: string | null): void {
  const db = getDb()
  const stmt = db.prepare(`
    UPDATE skills
    SET content = ?, contentError = ?, contentFetchedAt = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE slug = ?
  `)
  stmt.run(content, error, new Date().toISOString(), slug)
}

// Get all skills
export function getAllSkills(): SkillRow[] {
  const db = getDb()
  return db.prepare('SELECT * FROM skills ORDER BY rowid').all() as SkillRow[]
}

// Get total skill count
export function getSkillCount(): number {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) as count FROM skills').get() as { count: number }
  return row.count
}

// Get all slugs (for deduplication on resume)
export function getAllSlugs(): string[] {
  const db = getDb()
  return (db.prepare('SELECT slug FROM skills').all() as { slug: string }[]).map((r) => r.slug)
}

// Get skills without content
export function getSkillsWithoutContent(): SkillRow[] {
  const db = getDb()
  return db.prepare('SELECT * FROM skills WHERE content IS NULL AND contentError IS NULL').all() as SkillRow[]
}

// Get skill by slug
export function getSkillBySlug(slug: string): SkillRow | null {
  const db = getDb()
  return db.prepare('SELECT * FROM skills WHERE slug = ?').get(slug) as SkillRow | null
}

// Search skills
export function searchSkills(params: {
  query?: string
  tags?: string[]
  author?: string
  limit: number
  offset: number
}): { skills: SkillRow[]; total: number } {
  const db = getDb()
  const conditions: string[] = []
  const queryParams: unknown[] = []

  if (params.query) {
    conditions.push('(name LIKE ? OR skillId LIKE ? OR owner LIKE ? OR repo LIKE ?)')
    const pattern = `%${params.query}%`
    queryParams.push(pattern, pattern, pattern, pattern)
  }

  if (params.tags && params.tags.length > 0) {
    const placeholders = params.tags.map(() => '?').join(', ')
    conditions.push(`repo IN (${placeholders})`)
    queryParams.push(...params.tags)
  }

  if (params.author) {
    conditions.push('owner = ?')
    queryParams.push(params.author)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM skills ${whereClause}`)
  const { count } = countStmt.get(...queryParams) as { count: number }

  // Get paginated results
  const dataStmt = db.prepare(`SELECT * FROM skills ${whereClause} ORDER BY rowid LIMIT ? OFFSET ?`)
  const skills = dataStmt.all(...queryParams, params.limit, params.offset) as SkillRow[]

  return { skills, total: count }
}

// Get filter stats (tag/author counts)
export function getFilterStats(): {
  tags: Array<{ name: string; count: number }>
  authors: Array<{ name: string; count: number }>
} {
  const db = getDb()

  const tags = db
    .prepare(`
    SELECT repo as name, COUNT(*) as count
    FROM skills
    GROUP BY repo
    ORDER BY count DESC
    LIMIT 20
  `)
    .all() as Array<{ name: string; count: number }>

  const authors = db
    .prepare(`
    SELECT owner as name, COUNT(*) as count
    FROM skills
    GROUP BY owner
    ORDER BY count DESC
    LIMIT 15
  `)
    .all() as Array<{ name: string; count: number }>

  return { tags, authors }
}

// Metadata operations
export function setMetadata(key: string, value: string): void {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO metadata (key, value, updatedAt)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = CURRENT_TIMESTAMP
  `)
  stmt.run(key, value)
}

export function getMetadata(key: string): string | null {
  const db = getDb()
  const row = db.prepare('SELECT value FROM metadata WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}
