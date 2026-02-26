import { useState, useCallback } from 'react'
import { useAppContext } from '../../context/AppContext'
import { useFuzzySearch } from '../../hooks/useFuzzySearch'
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation'
import { useLicense } from '../../hooks/useLicense'
import { RepoListItem } from './RepoListItem'
import { EditorPicker } from './EditorPicker'

export function RepoList(): JSX.Element {
  const { state, dispatch } = useAppContext()
  const { isLimited, maxRepos } = useLicense()
  const allFiltered = useFuzzySearch(state.repos, state.searchQuery, state.activeTagFilter)
  const filtered = isLimited ? allFiltered.slice(0, maxRepos) : allFiltered

  const [editorPicker, setEditorPicker] = useState<{
    repoId: string
    x: number
    y: number
  } | null>(null)

  const handleConfirm = useCallback(() => {
    if (filtered.length > 0 && state.selectedIndex < filtered.length) {
      window.electronAPI.openInEditor(filtered[state.selectedIndex].id)
    }
  }, [filtered, state.selectedIndex])

  const handleDismiss = useCallback(() => {
    window.electronAPI.hideLauncher()
  }, [])

  useKeyboardNavigation(
    filtered.length,
    state.selectedIndex,
    (index) => dispatch({ type: 'SET_SELECTED_INDEX', payload: index }),
    handleConfirm,
    handleDismiss
  )

  const openEditorPicker = (repoId: string, e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setEditorPicker({ repoId, x: e.clientX, y: e.clientY })
  }

  const handleSelectRepo = (repo: { id: string; path: string; name: string }): void => {
    if (state.selectedRepo?.id === repo.id) {
      dispatch({ type: 'DESELECT_REPO' })
    } else {
      dispatch({ type: 'SELECT_REPO', payload: { id: repo.id, path: repo.path, name: repo.name } })
    }
  }

  const handleLaunch = (repoId: string, e: React.MouseEvent): void => {
    e.stopPropagation()
    window.electronAPI.openInEditor(repoId)
  }

  const handleAddRepo = async (): Promise<void> => {
    const newRepo = await window.electronAPI.addRepo()
    if (newRepo) {
      const repos = await window.electronAPI.getRepos()
      dispatch({ type: 'SET_REPOS', payload: repos })
    }
  }

  if (state.repos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">No repos added yet</div>
        <div className="empty-state-subtitle">
          Add your project folders to quickly open them from here
        </div>
        <button onClick={handleAddRepo}>
          Add Repo
        </button>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">No matches</div>
        <div className="empty-state-subtitle">Try a different search term or clear filters</div>
      </div>
    )
  }

  return (
    <div className="repo-list">
      {filtered.map((repo, index) => (
        <RepoListItem
          key={repo.id}
          repo={repo}
          isSelected={index === state.selectedIndex || state.selectedRepo?.id === repo.id}
          onClick={() => handleSelectRepo(repo)}
          onContextMenu={(e) => openEditorPicker(repo.id, e)}
          onLaunch={(e) => handleLaunch(repo.id, e)}
          onPickEditor={(e) => openEditorPicker(repo.id, e)}
        />
      ))}
      {editorPicker && (
        <EditorPicker
          repoId={editorPicker.repoId}
          position={{ x: editorPicker.x, y: editorPicker.y }}
          onClose={() => setEditorPicker(null)}
        />
      )}
    </div>
  )
}
