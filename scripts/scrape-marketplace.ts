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
  const { scrapeSkillsToDb, batchFetchSkillContent } = await import('../src/main/skills-scraper.js')
  const { createServiceClient } = await import('../src/main/skills-supabase.js')

  const client = createServiceClient()

  console.log('Step 1/2: Scraping skill index from skills.sh...')

  const { count } = await scrapeSkillsToDb(client, (done, total, phase) => {
    console.log(`  ${phase} (${done}/${total})`)
  })

  console.log(`Found ${count} skills`)
  console.log('\nStep 2/2: Fetching content for all skills...')

  const { successful, failed } = await batchFetchSkillContent(client, (current, total, slug) => {
    if (current % 10 === 0) {
      console.log(`  Fetched ${current}/${total}: ${slug}`)
    }
  })

  console.log(`\n✓ Complete!`)
  console.log(`  ${successful} skills fetched successfully`)
  console.log(`  ${failed} skills failed`)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
