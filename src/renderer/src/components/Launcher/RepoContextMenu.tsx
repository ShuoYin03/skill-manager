import { useEffect } from 'react'

interface RepoContextMenuProps {
  repoId: string
  position: { x: number; y: number }
  onClose: () => void
  onRemove: () => void
}

function TrashIcon(): JSX.Element {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

export function RepoContextMenu({ repoId: _repoId, position, onClose, onRemove }: RepoContextMenuProps): JSX.Element {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc, true)
    return () => document.removeEventListener('keydown', handleEsc, true)
  }, [onClose])

  return (
    <>
      <div className="editor-picker-overlay" onClick={onClose} />
      <div
        className="editor-picker"
        style={{
          top: Math.min(position.y, window.innerHeight - 80),
          left: Math.min(position.x, window.innerWidth - 200)
        }}
      >
        <button
          className="editor-picker-item repo-context-remove"
          onClick={() => { onRemove(); onClose() }}
        >
          <TrashIcon />
          <span>Remove from app</span>
        </button>
      </div>
    </>
  )
}
