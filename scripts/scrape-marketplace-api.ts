// Load .env before anything else
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config()
} catch {
  // dotenv not available — rely on env vars being set externally
}

// Mock the electron module (required by transitively-imported modules)
const Module = require('module')
const originalRequire = Module.prototype.require
Module.prototype.require = function (id: string) {
  if (id === 'electron') {
    return { app: { getPath: () => '', getAppPath: () => process.cwd() } }
  }
  return originalRequire.apply(this, arguments)
}

async function main() {
  const { scrapeAllSkillsViaAPI } = await import('../src/main/skills-scraper-api.js')
  const { batchFetchSkillContent } = await import('../src/main/skills-scraper.js')
  const { createServiceClient, setMetadata } = await import('../src/main/skills-supabase.js')

  const client = createServiceClient()

  // --reset: clear saved progress so all queries run again (needed to populate installs data)
  if (process.argv.includes('--reset')) {
    console.log('🔄 Resetting scrape progress...')
    await setMetadata('apiScrapeProgress', '', client)
    console.log('✓ Progress cleared — will re-run all queries.\n')
  }

  console.log('🌐 API-Based Full Scrape — Targeting ~71,667 skills')
  console.log('This will take 20-30 minutes with rate limiting.\n')

  console.log('Step 1/2: Enumerating ALL skills via search API...')

  const { dbTotal, newThisRun, queries, skipped } = await scrapeAllSkillsViaAPI(client, (current, total, phase, stats) => {
    console.log(`  [${current}/${total}] ${phase} — New this run: ${stats.discovered} (+${stats.newInBatch})`)
  })

  if (skipped) {
    console.log(`\n✓ All queries already completed — no new scraping needed.`)
  } else {
    console.log(`\n✓ API Scrape Complete!`)
    console.log(`  +${newThisRun} new skills found this run`)
  }
  console.log(`  ${dbTotal} total skills in database`)
  console.log(`  ${queries} queries executed (total)`)

  console.log('\nStep 2/2: Fetching content for new skills...')

  const { successful, failed } = await batchFetchSkillContent(client, (current, total, slug) => {
    if (current % 10 === 0) {
      console.log(`  Fetched ${current}/${total}: ${slug}`)
    }
  })

  console.log(`\n✓ Content Fetch Complete!`)
  console.log(`  ${successful} skills fetched successfully`)
  console.log(`  ${failed} skills failed`)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
