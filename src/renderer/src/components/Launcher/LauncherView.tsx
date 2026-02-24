import { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { useLicense } from '../../hooks/useLicense'
import { DragHandle } from './DragHandle'
import { SearchBar } from './SearchBar'
import { TagFilter } from './TagFilter'
import { RepoList } from './RepoList'
import { TrialBanner } from './TrialBanner'
import { NagScreen } from './NagScreen'
import { SkillsPanel } from '../Skills/SkillsPanel'

export function LauncherView(): JSX.Element {
  const { state, dispatch } = useAppContext()
  const { isExpired } = useLicense()
  const [nagDismissed, setNagDismissed] = useState(false)

  const panelOpen = state.selectedRepo !== null

  return (
    <div className="launcher">
      {isExpired && !nagDismissed && <NagScreen onDismiss={() => setNagDismissed(true)} />}

      {/* Titlebar: drag strip + app name + trial banner + gear */}
      <div className="launcher-titlebar">
        <DragHandle />
        <div className="launcher-titlebar-body">
          <span className="launcher-app-name">Repositories</span>
          <div className="launcher-titlebar-right">
            <TrialBanner />
            <button
              className="gear-button"
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'settings' })}
              title="Settings"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="launcher-search-section">
        <SearchBar />
      </div>

      {/* Tag filter pills */}
      <TagFilter />

      {/* Main content: repo list + optional skills panel */}
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
  )
}
