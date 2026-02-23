import path from 'path'
import os from 'os'

// Mock Electron app module BEFORE any imports that use it
const mockApp = {
  getPath: (name: string) => '',
  getAppPath: () => process.cwd()
}

// Mock the electron module
const Module = require('module')
const originalRequire = Module.prototype.require

Module.prototype.require = function (id: string) {
  if (id === 'electron') {
    return { app: mockApp }
  }
  return originalRequire.apply(this, arguments)
}

async function main() {
  const { scrapeAllSkillsViaAPI } = await import('../src/main/skills-scraper-api.js')
  const { batchFetchSkillContent } = await import('../src/main/skills-scraper.js')
  const { closeDb } = await import('../src/main/skills-db.js')

  console.log('🌐 API-Based Full Scrape — Targeting ~71,667 skills')
  console.log('This will take 20-30 minutes with rate limiting.\n')

  console.log('Step 1/2: Enumerating ALL skills via search API...')

  let lastUpdate = Date.now()
  const { totalDiscovered, queries } = await scrapeAllSkillsViaAPI((current, total, phase, stats) => {
    // Throttle progress updates to every 2 seconds
    if (Date.now() - lastUpdate > 2000) {
      console.log(`  [${current}/${total}] ${phase} — Discovered: ${stats.discovered} (+${stats.newInBatch} new)`)
      lastUpdate = Date.now()
    }
  })

  console.log(`\n✓ API Scrape Complete!`)
  console.log(`  ${totalDiscovered} total skills discovered`)
  console.log(`  ${queries} queries executed`)

  console.log('\nStep 2/2: Fetching content for new skills...')

  const { successful, failed } = await batchFetchSkillContent((current, total, slug) => {
    if (current % 10 === 0) {
      console.log(`  Fetched ${current}/${total}: ${slug}`)
    }
  })

  console.log(`\n✓ Content Fetch Complete!`)
  console.log(`  ${successful} skills fetched successfully`)
  console.log(`  ${failed} skills failed`)

  // Close database connection
  closeDb()
}

main().catch((err) => {
  console.error('Error:', err)
  import('../src/main/skills-db.js')
    .then(({ closeDb }) => closeDb())
    .catch(() => {})
  process.exit(1)
})
