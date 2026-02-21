import { useState, useCallback } from 'react'
import type { RepoEntry, EditorId } from '../../../../shared/types'
import { EditorSelector } from './EditorSelector'
import { BranchIndicator } from '../shared/BranchIndicator'

interface RepoEditRowProps {
  repo: RepoEntry
  onUpdate: (id: string, updates: Partial<RepoEntry>) => void
  onRemove: (id: string) => void
}

export function RepoEditRow({ repo, onUpdate, onRemove }: RepoEditRowProps): JSX.Element {
  const [tagsInput, setTagsInput] = useState(repo.tags.join(', '))
  const [confirmRemove, setConfirmRemove] = useState(false)

  const handleTagsBlur = useCallback(() => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onUpdate(repo.id, { tags })
  }, [tagsInput, repo.id, onUpdate])

  const handleTagsKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleTagsBlur()
      }
    },
    [handleTagsBlur]
  )

  return (
    <div className="repo-edit-row">
      <div className="repo-edit-row-header">
        <div>
          <div className="repo-edit-name">
            {repo.name}
            {repo.gitBranch && (
              <>
                {' '}
                <BranchIndicator branch={repo.gitBranch} />
              </>
            )}
          </div>
          <div className="repo-edit-path">{repo.path}</div>
        </div>
        {confirmRemove ? (
          <div className="repo-edit-controls">
            <button className="remove-btn" onClick={() => onRemove(repo.id)}>
              Confirm
            </button>
            <button
              className="remove-btn"
              style={{ color: 'var(--color-text-secondary)' }}
              onClick={() => setConfirmRemove(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button className="remove-btn" onClick={() => setConfirmRemove(true)}>
            Remove
          </button>
        )}
      </div>
      <div className="repo-edit-controls">
        <input
          className="repo-edit-tags-input"
          placeholder="Tags (comma-separated)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          onBlur={handleTagsBlur}
          onKeyDown={handleTagsKeyDown}
        />
        <EditorSelector
          value={repo.editorOverride}
          onChange={(id) => onUpdate(repo.id, { editorOverride: id as EditorId | null })}
          allowNone
          noneLabel="Use default"
        />
      </div>
    </div>
  )
}
