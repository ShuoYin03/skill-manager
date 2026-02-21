import { useRef, useEffect } from 'react'
import type { RepoEntry } from '../../../../shared/types'
import { BranchIndicator } from '../shared/BranchIndicator'
import { TagBadge } from '../shared/TagBadge'

interface RepoListItemProps {
  repo: RepoEntry
  isSelected: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onLaunch: (e: React.MouseEvent) => void
  onPickEditor: (e: React.MouseEvent) => void
}

function formatRelativeTime(timestamp: number | null): string | null {
  if (!timestamp) return null
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
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

  return (
    <div
      ref={ref}
      className={`repo-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="repo-item-header">
        <span className="repo-item-name">{repo.name}</span>
        <span className="repo-item-path">{repo.path}</span>
        <div className="repo-item-launch-split">
          <button
            className="repo-item-launch-main"
            onClick={onLaunch}
            title="Open in editor"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </button>
          <button
            className="repo-item-launch-chevron"
            onClick={onPickEditor}
            title="Choose editor"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
      <div className="repo-item-meta">
        {repo.gitBranch && <BranchIndicator branch={repo.gitBranch} />}
        {repo.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
        {repo.lastOpened && (
          <span className="repo-item-time">{formatRelativeTime(repo.lastOpened)}</span>
        )}
      </div>
    </div>
  )
}
