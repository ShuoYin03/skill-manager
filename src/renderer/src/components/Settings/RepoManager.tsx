import { useCallback } from 'react'
import { useAppContext } from '../../context/AppContext'
import { RepoEditRow } from './RepoEditRow'
import type { RepoEntry } from '../../../../shared/types'

export function RepoManager(): JSX.Element {
  const { state, dispatch } = useAppContext()

  const handleAddFolder = useCallback(async () => {
    const newRepo = await window.electronAPI.addRepo()
    if (newRepo) {
      dispatch({ type: 'SET_REPOS', payload: [...state.repos, newRepo] })
    }
  }, [state.repos, dispatch])

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<RepoEntry>) => {
      await window.electronAPI.updateRepo(id, updates)
      dispatch({
        type: 'SET_REPOS',
        payload: state.repos.map((r) => (r.id === id ? { ...r, ...updates } : r))
      })
    },
    [state.repos, dispatch]
  )

  const handleRemove = useCallback(
    async (id: string) => {
      await window.electronAPI.removeRepo(id)
      dispatch({
        type: 'SET_REPOS',
        payload: state.repos.filter((r) => r.id !== id)
      })
    },
    [state.repos, dispatch]
  )

  return (
    <div className="settings-section">
      <div className="repo-manager-header">
        <div className="settings-section-title">Repositories</div>
        <button className="add-folder-btn" onClick={handleAddFolder}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Folder
        </button>
      </div>
      {state.repos.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px' }}>
          <div className="empty-state-subtitle">
            No folders added yet. Click &quot;Add Folder&quot; to get started.
          </div>
        </div>
      ) : (
        state.repos.map((repo) => (
          <RepoEditRow
            key={repo.id}
            repo={repo}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        ))
      )}
    </div>
  )
}
