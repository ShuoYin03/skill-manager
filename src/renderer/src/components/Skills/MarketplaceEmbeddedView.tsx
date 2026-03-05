import { useState, useEffect, useCallback } from 'react'
import { marked } from 'marked'
import type { MarketplaceSkill, AITool, SkillFile, SkillFilterStats, SkillPreset } from '../../../../shared/types'
import { useAppContext } from '../../context/AppContext'
import { MarketplaceCard, SplitInstallButton, SkeletonCard, getIconColor } from './MarketplaceCard'
import { PresetsView } from './PresetsView'
import { AddToPresetDialog } from './AddToPresetDialog'

// Configure marked for safe inline rendering
marked.setOptions({ breaks: true })

// Deterministic repo dot color (same algorithm as RepoListItem)
const REPO_COLORS = [
  '#FF6B35', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#06B6D4', '#84CC16', '#F97316',
  '#14B8A6', '#6366F1', '#EC4899', '#8B5CF6',
]

function getRepoColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return REPO_COLORS[Math.abs(hash) % REPO_COLORS.length]
}

const AI_TOOL_LABELS: Record<string, string> = {
  claude: 'Claude', cursor: 'Cursor', windsurf: 'Windsurf', codex: 'Codex', copilot: 'Copilot',
}

function LocalInstalledCard({
  skillFile,
  isGlobal,
  onDelete,
}: {
  skillFile: SkillFile
  isGlobal: boolean
  onDelete: (sf: SkillFile) => Promise<void>
}): JSX.Element {
  const [deleting, setDeleting] = useState(false)
  const iconColor = getIconColor(skillFile.name)
  const label = isGlobal ? 'Global' : AI_TOOL_LABELS[skillFile.tool] ?? skillFile.tool

  const handleDelete = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    setDeleting(true)
    try { await onDelete(skillFile) } finally { setDeleting(false) }
  }

  return (
    <div className="marketplace-card is-installed">
      <div className="marketplace-card-icon" style={{ background: iconColor }}>
        {skillFile.name.charAt(0).toUpperCase()}
      </div>
      <div className="marketplace-card-content">
        <div className="marketplace-card-header">
          <span className="marketplace-card-title">{skillFile.name.replace(/-/g, ' ')}</span>
        </div>
        <div className="marketplace-card-installed-badges">
          <span className="marketplace-card-installed-badge">
            via {label}
            <button
              className={`marketplace-card-installed-delete${deleting ? ' deleting' : ''}`}
              onClick={(e) => void handleDelete(e)}
              title="Remove this installed skill"
              disabled={deleting}
            >
              {deleting ? '…' : '×'}
            </button>
          </span>
        </div>
        <div className="marketplace-card-desc">{skillFile.relativePath}</div>
      </div>
    </div>
  )
}

// Sidebar icons (same as LauncherView/SettingsView)
function ProjectsIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function MarketplaceIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function GearIcon(): JSX.Element {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function GlobeIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

type ActiveSection = 'marketplace' | 'presets'

function SkillDetail({
  skill,
  content,
  loading,
  onBack,
  onInstall,
  onAddToPreset,
  installLabel,
  selectedAITool,
  onSelectAITool,
}: {
  skill: MarketplaceSkill
  content: string
  loading: boolean
  onBack: () => void
  onInstall: () => Promise<void>
  onAddToPreset: () => void
  installLabel: string
  selectedAITool: AITool
  onSelectAITool: (tool: AITool) => void
}): JSX.Element {
  const [installing, setInstalling] = useState(false)

  const handleInstall = async (): Promise<void> => {
    setInstalling(true)
    try { await onInstall() } finally { setInstalling(false) }
  }

  const renderedHtml = content
    ? (marked(content) as string)
    : '<em style="opacity:0.5">(no content)</em>'

  return (
    <div className="skill-detail">
      <div className="skill-detail-header">
        <button className="skill-detail-back" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
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
            installLabel={installLabel}
            selectedAITool={selectedAITool}
            onSelectAITool={onSelectAITool}
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
          {skill.description && <p className="skill-detail-desc">{skill.description}</p>}
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
  skill, repoPath, onBack, onSaved, onDeleted,
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
    } finally { setSaving(false) }
  }

  const handleDelete = async (): Promise<void> => {
    if (!confirm(`Delete skill "${skill.name}"?`)) return
    setDeleting(true)
    try {
      await window.electronAPI.deleteSkill(repoPath, skill as unknown as Record<string, unknown>)
      onDeleted()
    } finally { setDeleting(false) }
  }

  return (
    <div className="skill-detail">
      <div className="skill-detail-header">
        <button className="skill-detail-back" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
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

export function MarketplaceEmbeddedView(): JSX.Element {
  const { state, dispatch } = useAppContext()
  const repos = state.repos

  const [activeSection, setActiveSection] = useState<ActiveSection>('marketplace')
  const [query, setQuery] = useState('')
  const [displayQuery, setDisplayQuery] = useState('')
  const [results, setResults] = useState<MarketplaceSkill[]>([])
  const [loading, setLoading] = useState(false)
  const [homeDir, setHomeDir] = useState<string>('')
  const [detailSkill, setDetailSkill] = useState<MarketplaceSkill | null>(null)
  const [detailContent, setDetailContent] = useState<string>('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [mySkills, setMySkills] = useState<SkillFile[]>([])
  const [mySkillsLoading, setMySkillsLoading] = useState(true)
  const [editingMySkill, setEditingMySkill] = useState<SkillFile | null>(null)

  // Repo strip selection
  const [selectedRepoValue, setSelectedRepoValue] = useState<string>('')

  // AI tool state (moved from top-right dropdown to install button dropdown)
  const [selectedAITool, setSelectedAITool] = useState<AITool>('claude')

  // Pagination & filter state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null)
  const [filterStats, setFilterStats] = useState<SkillFilterStats | null>(null)
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const [stripCollapsed, setStripCollapsed] = useState(false)
  const [showInstalledOnly, setShowInstalledOnly] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)

  // Preset management
  const [presets, setPresets] = useState<SkillPreset[]>([])
  const [addToPresetSkill, setAddToPresetSkill] = useState<MarketplaceSkill | null>(null)
  const [addingToPresetId, setAddingToPresetId] = useState<string | null>(null)

  useEffect(() => {
    async function init(): Promise<void> {
      const [home, presetList, stats] = await Promise.all([
        window.electronAPI.getHomeDir(),
        window.electronAPI.getSkillPresets(),
        window.electronAPI.getMarketplaceFilterStats().catch(() => null),
      ])
      if (repos.length > 0) setSelectedRepoValue(repos[0].path)
      setHomeDir(home)
      setPresets(presetList)
      if (stats) setFilterStats(stats)
    }
    init()
  }, [repos]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedRepo = repos.find((r) => r.path === selectedRepoValue) ?? null
  const isGlobal = selectedRepoValue === 'global'

  const installLabel = isGlobal
    ? `Install to Global via ${AI_TOOL_LABELS[selectedAITool]}`
    : selectedRepo
      ? `Install to ${selectedRepo.name} via ${AI_TOOL_LABELS[selectedAITool]}`
      : 'Install'

  // Scan My Skills when selected repo / global changes
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
        setSupabaseError(result.offlineReason ?? null)
      } catch (err) {
        setSupabaseError(String(err))
      } finally { setLoading(false) }
    }
    doSearch()
  }, [selectedTags, selectedAuthor, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(async (): Promise<void> => {
    setLoading(true)
    setPage(1)
    setDisplayQuery(query)
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
      setSupabaseError(result.offlineReason ?? null)
    } finally { setLoading(false) }
  }, [query, selectedTags, selectedAuthor])

  // Auto-dismiss toast notification after 2.5 seconds
  useEffect(() => {
    if (!notification) return
    const t = setTimeout(() => setNotification(null), 2500)
    return () => clearTimeout(t)
  }, [notification])

  const handleViewSkill = async (skill: MarketplaceSkill): Promise<void> => {
    setDetailSkill(skill)
    if (skill.content) {
      setDetailContent(skill.content)
    } else {
      setDetailLoading(true)
      try {
        const content = await window.electronAPI.getMarketplaceSkill(skill.slug)
        setDetailContent(content || '')
      } finally { setDetailLoading(false) }
    }
  }

  const handleInstall = async (skill: MarketplaceSkill): Promise<void> => {
    const content =
      skill.content || detailContent || (await window.electronAPI.getMarketplaceSkill(skill.slug)) || ''
    if (isGlobal) {
      if (!homeDir) { alert('Could not determine home directory.'); return }
      await window.electronAPI.installMarketplaceSkill(homeDir, selectedAITool, skill.slug, content, 'shared')
      setNotification(`"${skill.title}" installed to ~/.agent/skills/`)
      const repoSkills = await window.electronAPI.scanRepoSkills('global', homeDir)
      setMySkills(repoSkills?.skills ?? [])
    } else {
      if (!selectedRepo) { alert('Please select a project first.'); return }
      await window.electronAPI.installMarketplaceSkill(selectedRepo.path, selectedAITool, skill.slug, content)
      setNotification(`"${skill.title}" installed`)
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
        setNotification(`"${addToPresetSkill.title}" is already in "${preset.name}"`)
        return
      }
      const newSkill = { tool: selectedAITool, name: addToPresetSkill.title, content }
      const updated: SkillPreset = { ...preset, skills: [...preset.skills, newSkill] }
      await window.electronAPI.updateSkillPreset(updated as unknown as Record<string, unknown>)
      setPresets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setAddToPresetSkill(null)
      setNotification(`"${addToPresetSkill.title}" added to "${preset.name}"`)
    } finally { setAddingToPresetId(null) }
  }

  const mySkillRepoPath = isGlobal ? homeDir : (selectedRepo?.path ?? '')

  // Count tags not shown in collapsed state (approximate: depends on CSS layout)
  const allTags = filterStats?.tags ?? []
  // We show all tags but collapse via CSS; count helps the button label
  const hiddenTagCount = Math.max(0, allTags.length - 8)

  // Normalize skill names for matching: lowercase + replace hyphens/underscores with spaces
  // This bridges the gap between local file names ("my-awesome-skill") and marketplace
  // titles ("My Awesome Skill") which are derived from the same slug differently.
  const normalizeName = (s: string): string => s.toLowerCase().replace(/[-_]/g, ' ')

  // Return installed SkillFile entries that match a given marketplace skill title.
  // In global mode: deduplicate to 1 entry max (multiple paths collapse to one "via Global" badge).
  const getInstalledSkills = (skill: MarketplaceSkill): SkillFile[] => {
    const matches = mySkills.filter((s) => normalizeName(s.name) === normalizeName(skill.title))
    if (isGlobal && matches.length > 0) return [matches[0]]
    return matches
  }

  // Fast set for installed-only filter
  const installedNames = new Set(mySkills.map((s) => normalizeName(s.name)))

  // Delete an installed skill and refresh the local mySkills list
  const handleDeleteInstalled = async (skillFile: SkillFile): Promise<void> => {
    await window.electronAPI.deleteSkill(mySkillRepoPath, skillFile as unknown as Record<string, unknown>)
    setMySkills((prev) => prev.filter((s) => s.id !== skillFile.id))
  }


  // --- Detail / editing overlays ---
  if (editingMySkill && !detailSkill) {
    return (
      <div className="launcher">
        {renderSidebar()}
        {renderRepoStrip()}
        <div className="app-main">
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
      </div>
    )
  }

  if (detailSkill) {
    return (
      <div className="launcher">
        {renderSidebar()}
        {renderRepoStrip()}
        <div className="app-main">
          <SkillDetail
            skill={detailSkill}
            content={detailContent}
            loading={detailLoading}
            onBack={() => setDetailSkill(null)}
            onInstall={() => handleInstall(detailSkill)}
            onAddToPreset={() => handleOpenAddToPreset(detailSkill)}
            installLabel={installLabel}
            selectedAITool={selectedAITool}
            onSelectAITool={setSelectedAITool}
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
      </div>
    )
  }

  function renderSidebar(): JSX.Element {
    return (
      <div className="app-sidebar">
        <button
          className="app-sidebar-icon"
          title="Projects"
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'launcher' })}
        >
          <ProjectsIcon />
        </button>
        <button className="app-sidebar-icon active" title="Marketplace">
          <MarketplaceIcon />
        </button>
        <div className="app-sidebar-spacer" />
        <button
          className="app-sidebar-icon"
          title="Settings"
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'settings' })}
        >
          <GearIcon />
        </button>
      </div>
    )
  }

  function renderRepoStrip(): JSX.Element {
    if (stripCollapsed) {
      return (
        <div
          className="mp-repo-strip-collapsed-bar"
          onClick={() => setStripCollapsed(false)}
          title="Expand sidebar"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      )
    }
    return (
      <div className="mp-repo-strip">
        <div className="mp-repo-strip-header">
          <div className="mp-repo-strip-label">Projects</div>
          <button
            className="mp-repo-strip-toggle"
            onClick={() => setStripCollapsed(true)}
            title="Collapse sidebar"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
        <div
          className={`mp-repo-strip-item${isGlobal ? ' selected' : ''}`}
          onClick={() => setSelectedRepoValue('global')}
        >
          <span className="mp-repo-strip-globe"><GlobeIcon /></span>
          <span className="mp-repo-strip-name">Global</span>
        </div>
        {repos.length > 0 && <div className="mp-repo-strip-sep" />}
        {repos.map((repo) => (
          <div
            key={repo.id}
            className={`mp-repo-strip-item${selectedRepoValue === repo.path ? ' selected' : ''}`}
            onClick={() => setSelectedRepoValue(repo.path)}
          >
            <span
              className="mp-repo-strip-dot"
              style={{ background: getRepoColor(repo.name) }}
            />
            <span className="mp-repo-strip-name">{repo.name}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="launcher">
      {renderSidebar()}
      {renderRepoStrip()}

      <div className="app-main">
        {/* Top bar with section tabs + search */}
        <div className="app-topbar mp-embedded-topbar">
          <div className="mp-embedded-tabs">
            <button
              className={`mp-embedded-tab${activeSection === 'marketplace' ? ' active' : ''}`}
              onClick={() => setActiveSection('marketplace')}
            >
              Marketplace
            </button>
            <button
              className={`mp-embedded-tab${activeSection === 'presets' ? ' active' : ''}`}
              onClick={() => setActiveSection('presets')}
            >
              My Presets
            </button>
          </div>

          {activeSection === 'marketplace' && (
            <div className="mp-embedded-search">
              <div className="marketplace-search-wrap">
                <svg className="marketplace-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  className="marketplace-search-input mp-embedded-search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search skills..."
                />
              </div>
              <button className="marketplace-search-btn mp-embedded-search-btn" onClick={handleSearch}>
                Search
              </button>
            </div>
          )}
        </div>

        {/* Collapsible filter pills — Feature 1 */}
        {activeSection === 'marketplace' && filterStats && filterStats.tags.length > 0 && (
          <div className="mp-filter-wrap">
            <div className={`mp-filter-pills${tagsExpanded ? ' expanded' : ''}`}>
              {filterStats.tags.map((t) => (
                <button
                  key={t.name}
                  className={`marketplace-filter-pill${selectedTags.includes(t.name) ? ' active' : ''}`}
                  onClick={() => handleTagToggle(t.name)}
                >
                  {t.name}
                  <span className="marketplace-filter-count">{t.count}</span>
                </button>
              ))}
              {(selectedTags.length > 0 || selectedAuthor) && (
                <button className="marketplace-filter-clear" onClick={handleClearFilters}>
                  Clear ×
                </button>
              )}
            </div>
            {hiddenTagCount > 0 && (
              <button
                className="mp-filter-expand-btn"
                onClick={() => setTagsExpanded((v) => !v)}
              >
                {tagsExpanded ? '▲ Less' : `+${hiddenTagCount} more ▾`}
              </button>
            )}
          </div>
        )}

        {/* Scrollable content */}
        <div className="marketplace-standalone-content mp-embedded-content">
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

          {/* All Skills section */}
          {activeSection === 'marketplace' && (
            <div className="marketplace-section">
              {!loading && supabaseError && (
                <div className="mp-offline-banner">
                  Offline mode — {supabaseError}
                </div>
              )}
              <div className="marketplace-section-header">
                <span>{displayQuery.trim() ? `Results for "${displayQuery}" · ${showInstalledOnly ? mySkills.length : total}` : `All Skills · ${showInstalledOnly ? mySkills.length : total}`}</span>
                <label className="mp-installed-only-label">
                  <input
                    type="checkbox"
                    checked={showInstalledOnly}
                    onChange={(e) => setShowInstalledOnly(e.target.checked)}
                  />
                  Installed only
                </label>
              </div>
              {showInstalledOnly ? (
                mySkills.length === 0 ? (
                  <div className="marketplace-empty">No installed skills — install some from the marketplace first</div>
                ) : (
                  <div className="marketplace-standalone-grid">
                    {mySkills.map((sf) => (
                      <LocalInstalledCard
                        key={sf.id}
                        skillFile={sf}
                        isGlobal={isGlobal}
                        onDelete={handleDeleteInstalled}
                      />
                    ))}
                  </div>
                )
              ) : loading ? (
                <div className="marketplace-standalone-grid">
                  {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : results.length === 0 ? (
                <div className="marketplace-empty">No skills found</div>
              ) : (
                <>
                  <div className="marketplace-standalone-grid">
                    {results.map((skill) => (
                      <MarketplaceCard
                        key={skill.slug}
                        skill={skill}
                        onInstall={() => handleInstall(skill)}
                        onView={handleViewSkill}
                        onSaveToPreset={handleOpenAddToPreset}
                        installLabel={installLabel}
                        selectedAITool={selectedAITool}
                        onSelectAITool={setSelectedAITool}
                        installedSkills={getInstalledSkills(skill)}
                        onDeleteInstalled={handleDeleteInstalled}
                        isGlobal={isGlobal}
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
                </>
              )}
            </div>
          )}
        </div>
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

      {/* Toast notification */}
      {notification && <div className="mp-toast">{notification}</div>}
    </div>
  )
}
