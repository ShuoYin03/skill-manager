/**
 * One-time migration: SQLite → Supabase PostgreSQL
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx tsx scripts/migrate-sqlite-to-supabase.ts
 *
 * Run this BEFORE removing better-sqlite3 from package.json.
 * Make sure you have run the Supabase schema SQL first (see HANDOVER.md).
 */

import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env if present
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config()
} catch {
  // dotenv not available — rely on env vars being set externally
}

const SUPABASE_URL = 'https://lybfswqxojpofftfifrf.supabase.co/'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is not set.')
  console.error('Run: SUPABASE_SERVICE_ROLE_KEY=your_key tsx scripts/migrate-sqlite-to-supabase.ts')
  process.exit(1)
}

const DB_PATH = path.resolve('./data/marketplace.db')
const BATCH_SIZE = 500

interface SQLiteSkillRow {
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

interface SQLiteMetadataRow {
  key: string
  value: string
  updatedAt: string
}

async function main(): Promise<void> {
  // Dynamically import better-sqlite3 (must be installed)
  let Database: typeof import('better-sqlite3')
  try {
    Database = (await import('better-sqlite3')).default
  } catch {
    console.error('Error: better-sqlite3 is not installed. Run: npm install better-sqlite3')
    process.exit(1)
  }

  // Open SQLite database
  let db: import('better-sqlite3').Database
  try {
    db = new Database(DB_PATH, { readonly: true })
  } catch (err) {
    console.error(`Error: Cannot open SQLite database at ${DB_PATH}`)
    console.error('Make sure the file exists and you are running from the project root.')
    console.error(err)
    process.exit(1)
  }

  console.log(`Opened SQLite database: ${DB_PATH}`)

  // Count rows
  const skillCount = (db.prepare('SELECT COUNT(*) as count FROM skills').get() as { count: number }).count
  const metaCount = (db.prepare('SELECT COUNT(*) as count FROM metadata').get() as { count: number }).count
  console.log(`Skills: ${skillCount}  |  Metadata entries: ${metaCount}`)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY!)

  // ─── Migrate skills ────────────────────────────────────────────────────────
  console.log('\nMigrating skills...')

  const allSkills = db.prepare('SELECT * FROM skills').all() as SQLiteSkillRow[]
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < allSkills.length; i += BATCH_SIZE) {
    const batch = allSkills.slice(i, i + BATCH_SIZE)

    const rows = batch.map((s) => ({
      slug: s.slug,
      owner: s.owner,
      repo: s.repo,
      skill_id: s.skillId,
      name: s.name,
      content: s.content,
      content_fetched_at: s.contentFetchedAt,
      content_error: s.contentError,
      created_at: s.createdAt || new Date().toISOString(),
      updated_at: s.updatedAt || new Date().toISOString()
    }))

    const { error } = await supabase
      .from('marketplace_skills')
      .upsert(rows, { onConflict: 'slug' })

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message)
      errorCount += batch.length
    } else {
      successCount += batch.length
    }

    const pct = Math.round(((i + batch.length) / allSkills.length) * 100)
    process.stdout.write(`\r  Progress: ${i + batch.length}/${allSkills.length} (${pct}%)`)
  }

  console.log(`\n  Done: ${successCount} inserted, ${errorCount} errors`)

  // ─── Migrate metadata ──────────────────────────────────────────────────────
  console.log('\nMigrating metadata...')

  const allMeta = db.prepare('SELECT * FROM metadata').all() as SQLiteMetadataRow[]

  for (const row of allMeta) {
    const { error } = await supabase
      .from('marketplace_metadata')
      .upsert(
        { key: row.key, value: row.value, updated_at: row.updatedAt || new Date().toISOString() },
        { onConflict: 'key' }
      )
    if (error) {
      console.error(`  Metadata "${row.key}" error:`, error.message)
    } else {
      console.log(`  Migrated metadata: ${row.key} = ${row.value.slice(0, 60)}`)
    }
  }

  db.close()

  console.log('\n✓ Migration complete!')
  console.log(`  ${successCount}/${allSkills.length} skills migrated to Supabase`)
  console.log('  Verify in Supabase dashboard → Table Editor → marketplace_skills')
}

main().catch((err) => {
  console.error('\nUnexpected error:', err)
  process.exit(1)
})
