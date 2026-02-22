import path from 'path'
import os from 'os'

// Mock Electron app module BEFORE any imports that use it
const mockApp = {
  getPath: (name: string) => {
    // Not used anymore since we use process.cwd() directly
    return ''
  }
}

// Mock the electron module
;(global as any).electronApp = mockApp

// Create a module mock for 'electron'
const Module = require('module')
const originalRequire = Module.prototype.require

Module.prototype.require = function (id: string) {
  if (id === 'electron') {
    return { app: mockApp }
  }
  return originalRequire.apply(this, arguments)
}

async function main() {
  // Use dynamic imports after mock is set up
  const { scrapeSkillsToDb, batchFetchSkillContent } = await import('../src/main/skills-scraper.js')
  const { closeDb } = await import('../src/main/skills-db.js')

  console.log('Step 1/2: Scraping skill index from skills.sh...')

  const { count } = await scrapeSkillsToDb((done, total, phase) => {
    console.log(`  ${phase} (${done}/${total})`)
  })

  console.log(`Found ${count} skills`)
  console.log('\nStep 2/2: Fetching content for all skills...')

  const { successful, failed } = await batchFetchSkillContent((current, total, slug) => {
    if (current % 10 === 0) {
      console.log(`  Fetched ${current}/${total}: ${slug}`)
    }
  })

  console.log(`\n✓ Complete!`)
  console.log(`  ${successful} skills fetched successfully`)
  console.log(`  ${failed} skills failed`)

  // Close database connection
  closeDb()
}

main().catch((err) => {
  console.error('Error:', err)
  // Try to close db if available
  import('../src/main/skills-db.js').then(({ closeDb }) => closeDb()).catch(() => {})
  process.exit(1)
})
