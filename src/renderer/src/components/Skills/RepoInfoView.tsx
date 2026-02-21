import { useState } from 'react'
import { useAppContext } from '../../context/AppContext'

function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Never'
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const AI_TOOL_DIRS = [
  { name: 'Claude Code', dir: '.claude' },
  { name: 'Cursor', dir: '.cursor' },
  { name: 'Windsurf', dir: '.windsurf' },
  { name: 'Codex', dir: '.codex' },
  { name: 'Copilot', dir: '.github' }
]

export function RepoInfoView(): JSX.Element {
  const { state } = useAppContext()
  const [copied, setCopied] = useState(false)

  const repo = state.selectedRepo
  if (!repo) return <div className="repo-info-empty">No repo selected</div>

  const fullRepo = state.repos.find((r) => r.id === repo.id)

  const handleCopyPath = (): void => {
    navigator.clipboard.writeText(repo.path)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleOpenInEditor = (editorId?: string): void => {
    window.electronAPI.openInEditor(repo.id, editorId)
  }

  // Detect which AI tools have configs (from scanned skills)
  const detectedTools = state.repoSkills
    ? AI_TOOL_DIRS.filter((tool) =>
        state.repoSkills!.skills.some((s) => s.relativePath.startsWith(tool.dir))
      )
    : []

  return (
    <div className="repo-info">
      <div className="repo-info-section">
        <div className="repo-info-label">Path</div>
        <button className="repo-info-path" onClick={handleCopyPath} title="Click to copy">
          {repo.path}
          <span className="repo-info-copy-hint">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {fullRepo?.gitBranch && (
        <div className="repo-info-section">
          <div className="repo-info-label">Branch</div>
          <div className="repo-info-value">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
            {fullRepo.gitBranch}
          </div>
        </div>
      )}

      {fullRepo && fullRepo.tags.length > 0 && (
        <div className="repo-info-section">
          <div className="repo-info-label">Tags</div>
          <div className="repo-info-tags">
            {fullRepo.tags.map((tag) => (
              <span key={tag} className="repo-info-tag">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="repo-info-section">
        <div className="repo-info-label">Last Opened</div>
        <div className="repo-info-value">{formatRelativeTime(fullRepo?.lastOpened ?? null)}</div>
      </div>

      <div className="repo-info-section">
        <div className="repo-info-label">Open With</div>
        <div className="repo-info-editors">
          {state.editors.map((editor) => (
            <button
              key={editor.id}
              className="repo-info-editor-btn"
              onClick={() => handleOpenInEditor(editor.id)}
              title={`Open in ${editor.label}`}
            >
              {editor.label}
            </button>
          ))}
        </div>
      </div>

      {detectedTools.length > 0 && (
        <div className="repo-info-section">
          <div className="repo-info-label">AI Tools Configured</div>
          <div className="repo-info-ai-tools">
            {detectedTools.map((tool) => (
              <span key={tool.dir} className="repo-info-ai-tool">{tool.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
