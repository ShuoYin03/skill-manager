import { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import type { RepoEntry } from '../../../../shared/types'

interface RepoSettingsViewProps {
  repo: RepoEntry
}

export function RepoSettingsView({ repo }: RepoSettingsViewProps): JSX.Element {
  const { state, dispatch } = useAppContext()
  const [tagInput, setTagInput] = useState('')

  const handleEditorChange = async (value: string): Promise<void> => {
    await window.electronAPI.updateRepo(repo.id, { editorOverride: value || null })
    const repos = await window.electronAPI.getRepos()
    dispatch({ type: 'SET_REPOS', payload: repos })
  }

  const handleAddTag = async (): Promise<void> => {
    const tag = tagInput.trim()
    if (!tag || repo.tags.includes(tag)) return
    const newTags = [...repo.tags, tag]
    await window.electronAPI.updateRepo(repo.id, { tags: newTags })
    const repos = await window.electronAPI.getRepos()
    dispatch({ type: 'SET_REPOS', payload: repos })
    setTagInput('')
  }

  const handleRemoveTag = async (tag: string): Promise<void> => {
    const newTags = repo.tags.filter((t) => t !== tag)
    await window.electronAPI.updateRepo(repo.id, { tags: newTags })
    const repos = await window.electronAPI.getRepos()
    dispatch({ type: 'SET_REPOS', payload: repos })
  }

  return (
    <div className="repo-settings-view">
      <div className="repo-settings-section">
        <div className="repo-settings-label">Default Editor</div>
        <select
          className="repo-settings-select"
          value={repo.editorOverride ?? ''}
          onChange={(e) => handleEditorChange(e.target.value)}
        >
          <option value="">Use global default ({state.settings.defaultEditor})</option>
          {state.editors.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
        <div className="repo-settings-hint">
          Overrides the global default editor for this repo only.
        </div>
      </div>

      <div className="repo-settings-section">
        <div className="repo-settings-label">Tags</div>
        {repo.tags.length > 0 && (
          <div className="repo-settings-tags">
            {repo.tags.map((tag) => (
              <span key={tag} className="repo-settings-tag">
                {tag}
                <button
                  className="repo-settings-tag-remove"
                  onClick={() => handleRemoveTag(tag)}
                  title={`Remove tag "${tag}"`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="repo-settings-tag-input-row">
          <input
            className="repo-settings-tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleAddTag()
              }
            }}
            placeholder="Add tag…"
          />
          <button className="repo-settings-tag-add-btn" onClick={() => void handleAddTag()}>
            Add
          </button>
        </div>
        <div className="repo-settings-hint">Tags appear as filter pills in the launcher.</div>
      </div>
    </div>
  )
}
