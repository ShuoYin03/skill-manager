import { useState, useEffect } from 'react'
import { useAppContext } from '../../context/AppContext'
import { SkillsList } from './SkillsList'
import { SkillEditor } from './SkillEditor'
import { SkillCreateDialog } from './SkillCreateDialog'
import { PresetsView } from './PresetsView'
import { RepoInfoView } from './RepoInfoView'
import { RepoSettingsView } from './RepoSettingsView'
import { EditorPicker } from '../Launcher/EditorPicker'

import type { SkillsPanelView } from '../../../../shared/types'

const TABS: { id: SkillsPanelView; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'list', label: 'Skills' },
  { id: 'presets', label: 'Presets' },
  { id: 'settings', label: 'Settings' }
]

export function SkillsPanel(): JSX.Element {
  const { state, dispatch } = useAppContext()
  const [showCreate, setShowCreate] = useState(false)
  const [openPickerPos, setOpenPickerPos] = useState<{ x: number; y: number } | null>(null)

  const activeRepo = state.selectedRepo
  const panelView = state.repoPanelView

  // Scan skills when panel opens or repo changes
  useEffect(() => {
    if (!activeRepo) return
    async function scan(): Promise<void> {
      const repoSkills = await window.electronAPI.scanRepoSkills(
        activeRepo!.id,
        activeRepo!.path
      )
      dispatch({ type: 'SET_REPO_SKILLS', payload: repoSkills })
    }
    scan()
  }, [activeRepo, dispatch])

  // Handle Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        dispatch({ type: 'DESELECT_REPO' })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dispatch])

  const handleClose = (): void => {
    dispatch({ type: 'DESELECT_REPO' })
  }

  return (
    <div className="skills-panel">
      <div className="skills-panel-header">
        <div className="skills-panel-title-row">
          <div className="skills-panel-repo-name">{activeRepo?.name ?? ''}</div>
          <button className="skills-panel-close" onClick={handleClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
        {panelView !== 'editor' && (
          <div className="skills-panel-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`skills-panel-tab ${panelView === tab.id ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_SKILLS_PANEL_VIEW', payload: tab.id })}
              >
                {tab.label}
              </button>
            ))}
            {activeRepo && (
              <div className="panel-open-group">
                <button
                  className="panel-open-btn"
                  onClick={() => void window.electronAPI.openInEditor(activeRepo.id)}
                >
                  Open
                </button>
                <button
                  className="panel-open-chevron"
                  onClick={(e) => setOpenPickerPos({ x: e.clientX, y: e.clientY })}
                  title="Choose editor"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="skills-panel-content">
        {panelView === 'info' && <RepoInfoView />}
        {panelView === 'list' && (
          <SkillsList
            onCreateSkill={() => setShowCreate(true)}
            onGoToMarketplace={() => dispatch({ type: 'SET_VIEW', payload: 'marketplace' })}
          />
        )}
        {panelView === 'editor' && <SkillEditor />}
        {panelView === 'presets' && <PresetsView />}
        {panelView === 'settings' && activeRepo && (() => {
          const fullRepo = state.repos.find(r => r.id === activeRepo.id)
          return fullRepo ? <RepoSettingsView repo={fullRepo} /> : null
        })()}
      </div>

      {showCreate && <SkillCreateDialog onClose={() => setShowCreate(false)} />}
      {openPickerPos && activeRepo && (
        <EditorPicker
          repoId={activeRepo.id}
          position={openPickerPos}
          onClose={() => setOpenPickerPos(null)}
        />
      )}
    </div>
  )
}
