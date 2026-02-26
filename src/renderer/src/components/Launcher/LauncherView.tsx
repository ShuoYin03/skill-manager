import { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { useLicense } from '../../hooks/useLicense'
import { SearchBar } from './SearchBar'
import { TagFilter } from './TagFilter'
import { RepoList } from './RepoList'
import { TrialBanner } from './TrialBanner'
import { NagScreen } from './NagScreen'
import { SkillsPanel } from '../Skills/SkillsPanel'

// SVG icons inline
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

export function LauncherView(): JSX.Element {
  const { state, dispatch } = useAppContext()
  const { isExpired } = useLicense()
  const [nagDismissed, setNagDismissed] = useState(false)

  const panelOpen = state.selectedRepo !== null
  const hasRepos = state.repos.length > 0

  const handleAddRepo = async (): Promise<void> => {
    const newRepo = await window.electronAPI.addRepo()
    if (newRepo) {
      const repos = await window.electronAPI.getRepos()
      dispatch({ type: 'SET_REPOS', payload: repos })
    }
  }

  return (
    <div className="launcher">
      {isExpired && !nagDismissed && <NagScreen onDismiss={() => setNagDismissed(true)} />}

      {/* App Shell Sidebar */}
      <div className="app-sidebar">
        <button className="app-sidebar-icon active" title="Projects">
          <ProjectsIcon />
        </button>
        <button
          className="app-sidebar-icon"
          title="Marketplace"
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'marketplace' })}
        >
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

      {/* Main content area */}
      <div className="app-main">
        {/* Top bar */}
        <div className="app-topbar">
          <span className="app-topbar-title">Projects</span>
          <div className="app-topbar-search">
            <SearchBar />
          </div>
          {hasRepos && (
            <button
              className="topbar-add-repo-btn"
              onClick={handleAddRepo}
              title="Add repository"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add
            </button>
          )}
          <TrialBanner />
        </div>

        {/* Tag filter pills */}
        <TagFilter />

        {/* Main content: repo grid + optional skills panel */}
        <div className={`launcher-split ${panelOpen ? 'split-open' : ''}`}>
          <div className="launcher-list-pane">
            <RepoList />
          </div>
          {panelOpen && (
            <div className="launcher-detail-pane">
              <SkillsPanel />
            </div>
          )}
        </div>

        {/* Footer: keyboard hints */}
        <div className="launcher-footer">
          <div className="launcher-footer-hints">
            <span className="launcher-footer-hint">
              <kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate
            </span>
            <span className="launcher-footer-hint">
              <kbd>&crarr;</kbd> open
            </span>
            <span className="launcher-footer-hint">
              <kbd>esc</kbd> close
            </span>
            <span className="launcher-footer-hint">right-click for editor</span>
          </div>
        </div>
      </div>
    </div>
  )
}
