import { useState, useEffect, useCallback } from 'react'
import { marked } from 'marked'
import type { MarketplaceSkill, AITool, RepoEntry, SkillFile, SkillFilterStats, SkillPreset } from '../../../../shared/types'
import { MarketplaceCard, SplitInstallButton, getIconColor } from './MarketplaceCard'
import { PresetsView } from './PresetsView'
import { AddToPresetDialog } from './AddToPresetDialog'

type ActiveSection = 'marketplace' | 'presets'

const AI_TOOL_OPTIONS: { value: AITool; label: string }[] = [
  { value: 'claude', label: 'Claude' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'windsurf', label: 'Windsurf' },
  { value: 'codex', label: 'Codex' },
  { value: 'copilot', label: 'Copilot' },
]

// Configure marked for safe inline rendering
marked.setOptions({ breaks: true })

function SkillDetail({
  skill,
  content,
  loading,
  onBack,
  onInstall,
  onAddToPreset,
  installLabel,
}: {
  skill: MarketplaceSkill
  content: string
  loading: boolean
  onBack: () => void
  onInstall: () => Promise<void>
  onAddToPreset: () => void
  installLabel: string
}): JSX.Element {
  const [installing, setInstalling] = useState(false)

  const handleInstall = async (): Promise<void> => {
    setInstalling(true)
    try {
      await onInstall()
    } finally {
      setInstalling(false)
    }
  }

  const renderedHtml = content
    ? (marked(content) as string)
    : '<em style="opacity:0.5">(no content)</em>'

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
          <button className="skill-detail-add-preset-btn" onClick={onAddToPreset} title="Add to a preset">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Add to Preset
          </button>
          <SplitInstallButton
            installing={installing}
            onInstallNow={handleInstall}
            onSaveToPreset={onAddToPreset}
            installLabel={installLabel}
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
            <div
              className="skill-detail-content skill-detail-content--rendered"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function MySkillDetailView({
  skill,
  repoPath,
  onBack,
  onSaved,
  onDeleted,
}: {
  skill: SkillFile
  repoPath: string
  onBack: () => void
  onSaved: (updated: SkillFile) => void
  onDeleted: () => void
}): JSX.Element {
  const [content, setContent] = useState(skill.content)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const hasChanges = content !== skill.content

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      const updated = { ...skill, content }
      await window.electronAPI.updateSkill(repoPath, updated as unknown as Record<string, unknown>)
      onSaved(updated)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!confirm(`Delete skill "${skill.name}"?`)) return
    setDeleting(true)
    try {
      await window.electronAPI.deleteSkill(repoPath, skill as unknown as Record<string, unknown>)
      onDeleted()
    } finally {
      setDeleting(false)
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
          <button className="skill-detail-delete-btn" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete Skill'}
          </button>
          <button className="skill-detail-save-btn" onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <div className="skill-detail-body">
        <div className="skill-detail-meta">
          <h2 className="skill-detail-title">{skill.name}</h2>
          <span className="skill-detail-author">{skill.tool} · {skill.relativePath}</span>
        </div>
        <div className="skill-detail-content-section">
          <div className="skill-detail-content-label">Edit Skill Content</div>
          <textarea
            className="skill-detail-editor-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            placeholder="Write your skill content in markdown..."
          />
        </div>
      </div>
    </div>
  )
}

export function MarketplaceStandaloneView(): JSX.Element {
  const [activeSection, setActiveSection] = useState<ActiveSection>('marketplace')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MarketplaceSkill[]>([])
  const [loading, setLoading] = useState(false)
  const [repos, setRepos] = useState<RepoEntry[]>([])
  const [homeDir, setHomeDir] = useState<string>('')
  const [detailSkill, setDetailSkill] = useState<MarketplaceSkill | null>(null)
  const [detailContent, setDetailContent] = useState<string>('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [mySkills, setMySkills] = useState<SkillFile[]>([])
  const [mySkillsLoading, setMySkillsLoading] = useState(true)
  const [editingMySkill, setEditingMySkill] = useState<SkillFile | null>(null)

  // Global selectors (top-right)
  const [selectedRepoValue, setSelectedRepoValue] = useState<string>('') // repo.path or 'global'
  const [selectedAITool, setSelectedAITool] = useState<AITool>('claude')

  // Pagination & filter state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null)
  const [filterStats, setFilterStats] = useState<SkillFilterStats | null>(null)

  // Preset management
  const [presets, setPresets] = useState<SkillPreset[]>([])
  const [addToPresetSkill, setAddToPresetSkill] = useState<MarketplaceSkill | null>(null)
  const [addingToPresetId, setAddingToPresetId] = useState<string | null>(null)

  useEffect(() => {
    async function init(): Promise<void> {
      const [repoList, home, presetList] = await Promise.all([
        window.electronAPI.getRepos(),
        window.electronAPI.getHomeDir(),
        window.electronAPI.getSkillPresets(),
      ])
      setRepos(repoList)
      if (repoList.length > 0) setSelectedRepoValue(repoList[0].path)
      setHomeDir(home)
      setPresets(presetList)
      try {
        const stats = await window.electronAPI.getMarketplaceFilterStats()
        setFilterStats(stats)
      } catch {
        // ignore
      }
    }
    init()
  }, [])

  // Derive selected repo from value
  const selectedRepo = repos.find((r) => r.path === selectedRepoValue) ?? null
  const isGlobal = selectedRepoValue === 'global'

  // Compute install label for tooltips
  const installLabel = isGlobal
    ? `Install to Global via ${AI_TOOL_OPTIONS.find((o) => o.value === selectedAITool)?.label ?? selectedAITool}`
    : selectedRepo
      ? `Install to ${selectedRepo.name} via ${AI_TOOL_OPTIONS.find((o) => o.value === selectedAITool)?.label ?? selectedAITool}`
      : 'Install'

  // Scan My Skills whenever selected repo / global changes
  useEffect(() => {
    if (isGlobal) {
      if (!homeDir) { setMySkills([]); return }
      setMySkillsLoading(true)
      window.electronAPI.scanRepoSkills('global', homeDir)
        .then((repoSkills) => setMySkills(repoSkills?.skills ?? []))
        .catch(() => setMySkills([]))
        .finally(() => setMySkillsLoading(false))
      return
    }
    if (!selectedRepo) { setMySkills([]); return }
    setMySkillsLoading(true)
    window.electronAPI.scanRepoSkills(selectedRepo.id, selectedRepo.path)
      .then((repoSkills) => setMySkills(repoSkills?.skills ?? []))
      .catch(() => setMySkills([]))
      .finally(() => setMySkillsLoading(false))
  }, [selectedRepo, isGlobal, homeDir]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-run search when filters or page changes
  useEffect(() => {
    async function doSearch(): Promise<void> {
      setLoading(true)
      try {
        const result = await window.electronAPI.searchMarketplace({
          query,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
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
  }, [selectedTags, selectedAuthor, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(async (): Promise<void> => {
    setLoading(true)
    setPage(1)
    try {
      const result = await window.electronAPI.searchMarketplace({
        query,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
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
  }, [query, selectedTags, selectedAuthor])

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

  const handleInstall = async (skill: MarketplaceSkill): Promise<void> => {
    const content =
      skill.content || detailContent || (await window.electronAPI.getMarketplaceSkill(skill.slug)) || ''
    if (isGlobal) {
      if (!homeDir) { alert('Could not determine home directory.'); return }
      await window.electronAPI.installMarketplaceSkill(homeDir, selectedAITool, skill.slug, content, 'shared')
      alert(`"${skill.title}" installed to ~/.agent/skills/`)
      const repoSkills = await window.electronAPI.scanRepoSkills('global', homeDir)
      setMySkills(repoSkills?.skills ?? [])
    } else {
      if (!selectedRepo) { alert('Please select a project first.'); return }
      await window.electronAPI.installMarketplaceSkill(selectedRepo.path, selectedAITool, skill.slug, content)
      alert(`"${skill.title}" installed!`)
      const repoSkills = await window.electronAPI.scanRepoSkills(selectedRepo.id, selectedRepo.path)
      setMySkills(repoSkills?.skills ?? [])
    }
  }

  const handleTagToggle = (tagName: string): void => {
    setPage(1)
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    )
  }

  const handleClearFilters = (): void => {
    setPage(1)
    setSelectedTags([])
    setSelectedAuthor(null)
  }

  const refreshMySkills = async (): Promise<void> => {
    if (isGlobal) {
      if (!homeDir) return
      const repoSkills = await window.electronAPI.scanRepoSkills('global', homeDir)
      setMySkills(repoSkills?.skills ?? [])
      return
    }
    if (!selectedRepo) return
    const repoSkills = await window.electronAPI.scanRepoSkills(selectedRepo.id, selectedRepo.path)
    setMySkills(repoSkills?.skills ?? [])
  }

  // --- Add to Preset ---
  const handleOpenAddToPreset = (skill: MarketplaceSkill): void => {
    setAddToPresetSkill(skill)
  }

  const handleAddSkillToPreset = async (presetId: string): Promise<void> => {
    if (!addToPresetSkill) return
    setAddingToPresetId(presetId)
    try {
      const content =
        addToPresetSkill.content ||
        (detailSkill?.slug === addToPresetSkill.slug ? detailContent : '') ||
        (await window.electronAPI.getMarketplaceSkill(addToPresetSkill.slug)) || ''

      const preset = presets.find((p) => p.id === presetId)
      if (!preset) return

      const alreadyIn = preset.skills.some((s) => s.name === addToPresetSkill.title)
      if (alreadyIn) {
        alert(`"${addToPresetSkill.title}" is already in preset "${preset.name}"`)
        return
      }

      const newSkill = { tool: 'claude' as AITool, name: addToPresetSkill.title, content }
      const updated: SkillPreset = { ...preset, skills: [...preset.skills, newSkill] }
      await window.electronAPI.updateSkillPreset(updated as unknown as Record<string, unknown>)
      setPresets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setAddToPresetSkill(null)
      alert(`"${addToPresetSkill.title}" added to preset "${preset.name}"`)
    } finally {
      setAddingToPresetId(null)
    }
  }

  // --- My Skills editing ---
  const mySkillRepoPath = isGlobal ? homeDir : (selectedRepo?.path ?? '')

  if (editingMySkill && !detailSkill) {
    return (
      <div className="marketplace-standalone">
        <MySkillDetailView
          skill={editingMySkill}
          repoPath={mySkillRepoPath}
          onBack={() => setEditingMySkill(null)}
          onSaved={(updated) => {
            setMySkills((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
            setEditingMySkill(null)
          }}
          onDeleted={() => {
            setMySkills((prev) => prev.filter((s) => s.id !== editingMySkill.id))
            setEditingMySkill(null)
          }}
        />
      </div>
    )
  }

  if (detailSkill) {
    return (
      <div className="marketplace-standalone">
        <SkillDetail
          skill={detailSkill}
          content={detailContent}
          loading={detailLoading}
          onBack={() => setDetailSkill(null)}
          onInstall={() => handleInstall(detailSkill)}
          onAddToPreset={() => handleOpenAddToPreset(detailSkill)}
          installLabel={installLabel}
        />
        {addToPresetSkill && (
          <AddToPresetDialog
            skillTitle={addToPresetSkill.title}
            presets={presets}
            adding={addingToPresetId}
            onAddToPreset={handleAddSkillToPreset}
            onClose={() => setAddToPresetSkill(null)}
          />
        )}
      </div>
    )
  }

  const sectionLabel = query.trim()
    ? `Results for "${query}" · ${total}`
    : `All Skills · ${total}`

  const showMySkills = activeSection === 'marketplace' && (selectedRepo !== null || isGlobal)

  return (
    <div className="marketplace-standalone">
      {/* Page header */}
      <div className="marketplace-standalone-header">
        <div className="marketplace-standalone-hero">
          <h1 className="marketplace-standalone-title">Skill Marketplace</h1>
          <p className="marketplace-standalone-subtitle">Discover and install skills for your AI tools</p>
        </div>

        {/* Section tabs */}
        <div className="marketplace-tabs">
          <button
            className={`marketplace-tab ${activeSection === 'marketplace' ? 'active' : ''}`}
            onClick={() => setActiveSection('marketplace')}
          >
            Marketplace
          </button>
          <button
            className={`marketplace-tab ${activeSection === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveSection('presets')}
          >
            My Presets
          </button>
        </div>

        {/* Search + filter — only shown in marketplace section */}
        {activeSection === 'marketplace' && (
          <>
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
              <div className="marketplace-standalone-repo-picker">
                <span className="marketplace-standalone-repo-label">Install to:</span>
                <select
                  className="marketplace-standalone-repo-select"
                  value={selectedRepoValue}
                  onChange={(e) => setSelectedRepoValue(e.target.value)}
                >
                  {repos.map((r) => (
                    <option key={r.id} value={r.path}>{r.name}</option>
                  ))}
                  {repos.length > 0 && <optgroup label="─────────" />}
                  <option value="global">Global (~/.agent/skills)</option>
                </select>
                <select
                  className="marketplace-standalone-ai-select"
                  value={selectedAITool}
                  onChange={(e) => setSelectedAITool(e.target.value as AITool)}
                >
                  {AI_TOOL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {filterStats && filterStats.tags.length > 0 && (
              <div className="marketplace-filter-row">
                {filterStats.tags.slice(0, 12).map((t) => (
                  <button
                    key={t.name}
                    className={`marketplace-filter-pill ${selectedTags.includes(t.name) ? 'active' : ''}`}
                    onClick={() => handleTagToggle(t.name)}
                  >
                    {t.name}
                    <span className="marketplace-filter-count">{t.count}</span>
                  </button>
                ))}
                {(selectedTags.length > 0 || selectedAuthor) && (
                  <button className="marketplace-filter-clear" onClick={handleClearFilters}>
                    Clear filters ×
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Content */}
      <div className="marketplace-standalone-content">
        {/* Presets section */}
        {activeSection === 'presets' && (
          <div className="marketplace-presets-container">
            <PresetsView
              repoPath={selectedRepo?.path}
              currentSkills={mySkills}
              onApplied={refreshMySkills}
              repos={repos}
            />
          </div>
        )}

        {/* My Skills section */}
        {showMySkills && (
          <div className="marketplace-section">
            <div className="marketplace-section-header">
              {isGlobal ? 'Global Skills' : 'My Skills'} · {mySkillsLoading ? '…' : mySkills.length}
            </div>
            {mySkillsLoading ? (
              <div className="marketplace-loading" style={{ padding: '20px' }}>Loading…</div>
            ) : mySkills.length === 0 ? (
              <div className="marketplace-my-skills-empty">
                {isGlobal ? 'No global skills found in ~/.agent/skills or tool-specific dirs' : 'No skills installed in this repo yet'}
              </div>
            ) : (
              <div className="marketplace-standalone-grid">
                {mySkills.map((skill) => {
                  const iconColor = getIconColor(skill.name)
                  return (
                    <div
                      key={skill.id}
                      className="marketplace-my-skill-card"
                      onClick={() => setEditingMySkill(skill)}
                      style={{ cursor: 'pointer' }}
                    >
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
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Marketplace section */}
        {activeSection === 'marketplace' && (loading ? (
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
                  onInstall={() => handleInstall(skill)}
                  onView={handleViewSkill}
                  onSaveToPreset={handleOpenAddToPreset}
                  installLabel={installLabel}
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
        ))}
      </div>

      {/* Add to Preset dialog */}
      {addToPresetSkill && (
        <AddToPresetDialog
          skillTitle={addToPresetSkill.title}
          presets={presets}
          adding={addingToPresetId}
          onAddToPreset={handleAddSkillToPreset}
          onClose={() => setAddToPresetSkill(null)}
        />
      )}
    </div>
  )
}
