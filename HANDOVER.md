# Handover Documentation

## Last Updated: 2026-02-23

---

## What Has Been Done

### Change 11: API-Based Full Scraper (`npm run scrape-all`)

**Status: COMPLETE**

Built a second scraper mode that uses the skills.sh search API to enumerate and store a much larger set of skills than the sitemap-based scraper.

#### Files Created
- **`src/main/skills-scraper-api.ts`** — Core API scraper module
  - Generates 676 two-character query strings (aa–zz) to enumerate all skills
  - Paginates through API results with controlled concurrency (3 parallel, 500ms delay)
  - Convergence detection: stops after 50 consecutive queries with no new skills
  - Resume capability: saves progress to database `metadata` table as `apiScrapeProgress`
  - Deduplication via in-memory `Set<string>` + database `upsertSkill()` ON CONFLICT
- **`scripts/scrape-marketplace-api.ts`** — CLI entry point
  - Mocks the Electron `app` module before imports so it can run in Node.js context
  - Phase 1: enumerate all skills via API (`scrapeAllSkillsViaAPI`)
  - Phase 2: fetch content for newly discovered skills (`batchFetchSkillContent`)

#### Package.json Changes
```json
"scrape-all": "npm rebuild better-sqlite3 && tsx scripts/scrape-marketplace-api.ts && npx electron-rebuild -f -w better-sqlite3"
```
The script rebuilds better-sqlite3 for Node.js (for tsx execution), then rebuilds back for Electron after.

#### Results Achieved
- **Before:** 4,000 skills (sitemap-only)
- **After `npm run scrape-all`:** 17,310 skills in database
- Ran through queries aa–vc before convergence detection triggered

---

## Known Issues / Limitations

### 1. `NODE_MODULE_VERSION` Mismatch
**Problem:** When `npm run scrape` or `npm run scrape-all` is run, it rebuilds `better-sqlite3` for Node.js (MODULE_VERSION 131). If the script exits before `npx electron-rebuild -f -w better-sqlite3` runs (e.g., Ctrl+C interrupt), `npm run dev` will fail with:
```
Error: The module '.../better_sqlite3.node' was compiled against a different
Node.js version using NODE_MODULE_VERSION 131. This version of Node.js
requires NODE_MODULE_VERSION 143.
```

**Fix:** Run `npx electron-rebuild -f -w better-sqlite3` manually before `npm run dev`.

**Permanent fix to investigate:** Add `postinstall` or `predev` script to always run electron-rebuild.

### 2. Coverage Gap: 17,310 vs 71,667 Skills
The skills.sh website shows 71,667 total skills. The scraper discovered 17,310 with the aa–zz enumeration strategy. Possible reasons:
- Skills are stored with names/slugs that don't match 2-char prefixes
- API may require longer prefixes for some skill namespaces
- Some skills may only be discoverable via exact slug or owner-specific queries

**Potential improvement:** Add 3-character combinations (aaa–zzz) or query by known owner namespaces to increase coverage.

### 3. Stale `apiTotalDiscovered` Metadata
The database shows `apiTotalDiscovered = 100` (stale from an early test run that was cleared). The actual count is in `skills` table (`COUNT(*) = 17310`). This metadata value is only cosmetic and doesn't affect functionality.

---

## Database State

**Location:** `/Users/shuo.yin/Personal/desktop-tool/data/marketplace.db`

| Key | Value |
|-----|-------|
| Total skills | 17,310 |
| Sitemap scrape | ~4,000 skills (from skills.sh sitemap.xml) |
| API scrape | ~13,310 additional skills |
| Content fetched | Varies — skills without content show placeholder |

---

## Recommended Next Steps

### Immediate
1. **Test `npm run dev`** — should work now that `electron-rebuild` was run
2. **Verify marketplace UI** — Open the marketplace window in the Electron app, confirm skills count shows 17,000+ and search works

### Short-term
3. **Increase API coverage** — Add 3-char query combinations or query by known popular owners (e.g., `vercel-labs`, `anthropics`) to get closer to 71,667 skills
4. **Fix scraper interrupt handling** — Wrap the scrape scripts so `electron-rebuild` runs even if the scraper is interrupted (use a shell `trap` or separate pre/post scripts)
5. **Content refresh** — Many of the 17,310 skills may have `content = NULL` (only fetched a small subset). Run content fetching to populate the rest

### Medium-term
6. **Schedule periodic scraping** — Add a dev-only "refresh marketplace" option or document the workflow for keeping the database current
7. **Ship database with app** — Bundle a pre-populated `marketplace.db` so users don't need to run the scraper themselves
8. **Better coverage metrics** — Show in the developer console how many skills have content vs. just metadata

---

## Developer Workflow

```bash
# Initial setup (first time only, takes 20-30 min)
npm run scrape-all

# Periodic updates (fast, 3-4 min)
npm run scrape

# If dev mode breaks after scraping
npx electron-rebuild -f -w better-sqlite3

# Check database state
sqlite3 data/marketplace.db "SELECT COUNT(*) FROM skills;"
```

---

## Architecture Summary

```
skills.sh/sitemap.xml ──► scrapeSkillsToDb() ──► SQLite skills table
                                                   (slug, owner, repo, skillId, name)
                                                        │
skills.sh/api/search ──► scrapeAllSkillsViaAPI() ─────►│
  (aa–zz queries)                                       │
                                                        ▼
                                           batchFetchSkillContent()
                                                        │
                                           (GitHub raw URLs + skills.sh HTML)
                                                        │
                                                        ▼
                                           updateSkillContent() ──► content column
                                                        │
                                                        ▼
                                           Electron IPC ──► MarketplaceStandaloneView
                                           (getMarketplaceSkill, searchMarketplace)
```
