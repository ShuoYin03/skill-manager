import { useRef, useEffect } from 'react'
import type { RepoEntry } from '../../../../shared/types'
import { BranchIndicator } from '../shared/BranchIndicator'
import { TagBadge } from '../shared/TagBadge'

// Deterministic color per repo name
const REPO_COLORS = [
  '#FF6B35', '#0EA5E9', '#10B981', '#F59E0B',
  '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6',
  '#F97316', '#06B6D4',
]

function getRepoColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return REPO_COLORS[Math.abs(hash) % REPO_COLORS.length]
}

interface RepoListItemProps {
  repo: RepoEntry
  isSelected: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onLaunch: (e: React.MouseEvent) => void
  onPickEditor: (e: React.MouseEvent) => void
}

export function RepoListItem({
  repo,
  isSelected,
  onClick,
  onContextMenu,
  onLaunch,
  onPickEditor
}: RepoListItemProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [isSelected])

  const iconColor = getRepoColor(repo.name)
  const initial = repo.name.charAt(0).toUpperCase()

  return (
    <div
      ref={ref}
      className={`repo-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* Top row: colored icon + launch buttons */}
      <div className="repo-item-top">
        <div className="repo-item-icon" style={{ background: iconColor }}>
          {initial}
        </div>
        <div className="repo-item-open-group">
          <button
            className="repo-item-open-btn"
            onClick={onLaunch}
          >
            Open
          </button>
          <button
            className="repo-item-open-picker"
            onClick={onPickEditor}
            title="Choose editor"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Repo name */}
      <div className="repo-item-name">{repo.name}</div>

      {/* Badges: branch + tags */}
      <div className="repo-item-meta">
        {repo.gitBranch && <BranchIndicator branch={repo.gitBranch} />}
        {repo.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
    </div>
  )
}
