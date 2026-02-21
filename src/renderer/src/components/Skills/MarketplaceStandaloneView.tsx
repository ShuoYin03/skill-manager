import { useState, useEffect, useCallback } from 'react'
import type { MarketplaceSkill, AITool, RepoEntry, SkillFile, SkillFilterStats } from '../../../../shared/types'
import { MarketplaceCard, SplitInstallButton, getIconColor } from './MarketplaceCard'
import type { InstallTarget } from './MarketplaceCard'

function SkillDetail({
  skill,
  content,
  loading,
  onBack,
  onInstall
}: {
  skill: MarketplaceSkill
  content: string
  loading: boolean
  onBack: () => void
  onInstall: (target: InstallTarget) => Promise<void>
}): JSX.Element {
  const [selected, setSelected] = useState<InstallTarget>('claude')
  const [installing, setInstalling] = useState(false)

  const handleInstall = async (target: InstallTarget): Promise<void> => {
    setInstalling(true)
    try {
      await onInstall(target)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="skill-detail">
      <div className="skill-detail-header">
        <button className="skill-detail-back" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="skill-detail-header-actions">
          <SplitInstallButton
            selected={selected}
            installing={installing}
            onInstallNow={() => handleInstall(selected)}
            onSelect={(target) => setSelected(target)}
            compact={false}
          />
        </div>
      </div>
      <div className="skill-detail-body">
        <div className="skill-detail-meta">
          <h2 className="skill-detail-title">{skill.title}</h2>
          <span className="skill-detail-author">by {skill.author}</span>
          {skill.tags.length > 0 && (
            <div className="skill-detail-tags">
              {skill.tags.map((tag) => (
                <span key={tag} className="marketplace-card-tag">{tag}</span>
              ))}
            </div>
          )}
          {skill.description && (
            <p className="skill-detail-desc">{skill.description}</p>
          )}
        </div>

        <div className="skill-detail-content-section">
          <div className="skill-detail-content-label">Skill Content</div>
          {loading ? (
            <div className="marketplace-loading">Loading content…</div>
          ) : (
            <pre className="skill-detail-content">{content || '(no content)'}</pre>
          )}
        </div>
      </div>
    </div>
  )
}

export function MarketplaceStandaloneView(): JSX.Element {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MarketplaceSkill[]>([])
  const [loading, setLoading] = useState(false)
  const [repos, setRepos] = useState<RepoEntry[]>([])
  const [selectedRepo, setSelectedRepo] = useState<RepoEntry | null>(null)
  const [homeDir, setHomeDir] = useState<string>('')
  const [detailSkill, setDetailSkill] = useState<MarketplaceSkill | null>(null)
  const [detailContent, setDetailContent] = useState<string>('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [mySkills, setMySkills] = useState<SkillFile[]>([])
  const [mySkillsLoading, setMySkillsLoading] = useState(true)

  // Pagination & filter state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null)
  const [filterStats, setFilterStats] = useState<SkillFilterStats | null>(null)

  useEffect(() => {
    async function init(): Promise<void> {
      const [repoList, home] = await Promise.all([
        window.electronAPI.getRepos(),
        window.electronAPI.getHomeDir(),
      ])
      setRepos(repoList)
      if (repoList.length > 0) setSelectedRepo(repoList[0])
      setHomeDir(home)
      // Filter stats are optional — no cache = no pills, not a blocker
      try {
        const stats = await window.electronAPI.getMarketplaceFilterStats()
        setFilterStats(stats)
      } catch {
        // ignore
      }
    }
    init()
  }, [])

  // Scan My Skills whenever selected repo changes
  useEffect(() => {
    if (!selectedRepo) { setMySkills([]); return }
    setMySkillsLoading(true)
    window.electronAPI.scanRepoSkills(selectedRepo.id, selectedRepo.path)
      .then((repoSkills) => setMySkills(repoSkills?.skills ?? []))
      .catch(() => setMySkills([]))
      .finally(() => setMySkillsLoading(false))
  }, [selectedRepo])

  // Re-run search when filters or page changes
  useEffect(() => {
    async function doSearch(): Promise<void> {
      setLoading(true)
      try {
        const result = await window.electronAPI.searchMarketplace({
          query,
          tag: selectedTag ?? undefined,
          author: selectedAuthor ?? undefined,
          page,
          pageSize: 24
        })
        setResults(result.skills)
        setTotal(result.total)
        setTotalPages(result.totalPages)
      } finally {
        setLoading(false)
      }
    }
    doSearch()
  }, [selectedTag, selectedAuthor, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(async (): Promise<void> => {
    setLoading(true)
    setPage(1)
    try {
      const result = await window.electronAPI.searchMarketplace({
        query,
        tag: selectedTag ?? undefined,
        author: selectedAuthor ?? undefined,
        page: 1,
        pageSize: 24
      })
      setResults(result.skills)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } finally {
      setLoading(false)
    }
  }, [query, selectedTag, selectedAuthor])

  const handleViewSkill = async (skill: MarketplaceSkill): Promise<void> => {
    setDetailSkill(skill)
    if (skill.content) {
      setDetailContent(skill.content)
    } else {
      setDetailLoading(true)
      try {
        const content = await window.electronAPI.getMarketplaceSkill(skill.slug)
        setDetailContent(content || '')
      } finally {
        setDetailLoading(false)
      }
    }
  }

  const handleInstall = async (skill: MarketplaceSkill, target: InstallTarget): Promise<void> => {
    const content =
      skill.content || detailContent || (await window.electronAPI.getMarketplaceSkill(skill.slug)) || ''
    if (target === 'global') {
      if (!homeDir) { alert('Could not determine home directory.'); return }
      await window.electronAPI.installMarketplaceSkill(homeDir, 'claude', skill.slug, content, 'shared')
      alert(`"${skill.title}" installed to ~/.agent/skills/`)
    } else {
      if (!selectedRepo) { alert('Please select a repo first.'); return }
      await window.electronAPI.installMarketplaceSkill(selectedRepo.path, target as AITool, skill.slug, content)
      alert(`"${skill.title}" installed!`)
      const repoSkills = await window.electronAPI.scanRepoSkills(selectedRepo.id, selectedRepo.path)
      setMySkills(repoSkills?.skills ?? [])
    }
  }

  const handleRemoveSkill = async (skill: SkillFile): Promise<void> => {
    if (!selectedRepo) return
    await window.electronAPI.deleteSkill(selectedRepo.path, skill as unknown as Record<string, unknown>)
    const repoSkills = await window.electronAPI.scanRepoSkills(selectedRepo.id, selectedRepo.path)
    setMySkills(repoSkills?.skills ?? [])
  }

  const handleTagToggle = (tagName: string): void => {
    setPage(1)
    setSelectedTag((prev) => (prev === tagName ? null : tagName))
  }

  const handleClearFilters = (): void => {
    setPage(1)
    setSelectedTag(null)
    setSelectedAuthor(null)
  }

  if (detailSkill) {
    return (
      <div className="marketplace-standalone">
        <SkillDetail
          skill={detailSkill}
          content={detailContent}
          loading={detailLoading}
          onBack={() => setDetailSkill(null)}
          onInstall={(target) => handleInstall(detailSkill, target)}
        />
      </div>
    )
  }

  const sectionLabel = query.trim()
    ? `Results for "${query}" · ${total}`
    : `All Skills · ${total}`

  return (
    <div className="marketplace-standalone">
      {/* Page header */}
      <div className="marketplace-standalone-header">
        <div className="marketplace-standalone-hero">
          <h1 className="marketplace-standalone-title">Skill Marketplace</h1>
          <p className="marketplace-standalone-subtitle">Discover and install skills for your AI tools</p>
        </div>

        {/* Search row */}
        <div className="marketplace-search-row">
          <div className="marketplace-search-wrap">
            <svg className="marketplace-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="marketplace-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search skills..."
              autoFocus
            />
          </div>
          <button className="marketplace-search-btn" onClick={handleSearch}>
            Search
          </button>
          {repos.length > 0 && (
            <div className="marketplace-standalone-repo-picker">
              <span className="marketplace-standalone-repo-label">Install to:</span>
              <select
                className="marketplace-standalone-repo-select"
                value={selectedRepo?.path ?? ''}
                onChange={(e) => {
                  const repo = repos.find((r) => r.path === e.target.value) ?? null
                  setSelectedRepo(repo)
                }}
              >
                {repos.map((r) => (
                  <option key={r.id} value={r.path}>{r.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filter pills */}
        {filterStats && filterStats.tags.length > 0 && (
          <div className="marketplace-filter-row">
            {filterStats.tags.slice(0, 12).map((t) => (
              <button
                key={t.name}
                className={`marketplace-filter-pill ${selectedTag === t.name ? 'active' : ''}`}
                onClick={() => handleTagToggle(t.name)}
              >
                {t.name}
                <span className="marketplace-filter-count">{t.count}</span>
              </button>
            ))}
            {(selectedTag || selectedAuthor) && (
              <button className="marketplace-filter-clear" onClick={handleClearFilters}>
                Clear filters ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="marketplace-standalone-content">
        {/* My Skills section */}
        {selectedRepo && (
          <div className="marketplace-section">
            <div className="marketplace-section-header">
              My Skills · {mySkillsLoading ? '…' : mySkills.length}
            </div>
            {mySkillsLoading ? (
              <div className="marketplace-loading" style={{ padding: '20px' }}>Loading…</div>
            ) : mySkills.length === 0 ? (
              <div className="marketplace-my-skills-empty">No skills installed in this repo yet</div>
            ) : (
              <div className="marketplace-standalone-grid">
                {mySkills.map((skill) => {
                  const iconColor = getIconColor(skill.name)
                  return (
                    <div key={skill.id} className="marketplace-my-skill-card">
                      <div className="marketplace-card-icon" style={{ background: iconColor }}>
                        {skill.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="marketplace-card-content">
                        <div className="marketplace-card-header">
                          <span className="marketplace-card-title">{skill.name}</span>
                          <span className="marketplace-card-author">{skill.tool}</span>
                        </div>
                        <div className="marketplace-card-desc">{skill.relativePath}</div>
                      </div>
                      <div className="marketplace-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="marketplace-my-skill-remove"
                          onClick={() => handleRemoveSkill(skill)}
                          title="Remove skill"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Marketplace section */}
        {loading ? (
          <div className="marketplace-loading">Loading…</div>
        ) : results.length === 0 ? (
          <div className="marketplace-empty">No skills found</div>
        ) : (
          <div className="marketplace-section">
            <div className="marketplace-section-header">{sectionLabel}</div>
            <div className="marketplace-standalone-grid">
              {results.map((skill) => (
                <MarketplaceCard
                  key={skill.slug}
                  skill={skill}
                  onInstall={(target) => handleInstall(skill, target)}
                  onView={handleViewSkill}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="marketplace-pagination">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>←</button>
                <span>{page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>→</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
