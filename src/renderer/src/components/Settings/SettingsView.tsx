import { useState, useEffect } from 'react'
import { useAppContext } from '../../context/AppContext'
import { AccountSection } from './AccountSection'
import { GeneralSettings } from './GeneralSettings'
import { RepoManager } from './RepoManager'
import { GlobalSkillsSection } from './GlobalSkillsSection'
import { GlobalInstructionsSection } from './GlobalInstructionsSection'

export function SettingsView(): JSX.Element {
  const { dispatch } = useAppContext()
  const [homeDir, setHomeDir] = useState('')

  useEffect(() => {
    window.electronAPI.getHomeDir().then((dir: string) => setHomeDir(dir))
  }, [])

  return (
    <div className="settings">
      <div className="settings-header">
        <button
          className="settings-back-btn"
          onClick={() => dispatch({ type: 'SET_VIEW', payload: 'launcher' })}
          title="Back to Launcher"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span className="settings-title">Settings</span>
      </div>
      <div className="settings-body">
        <AccountSection />
        <GeneralSettings />
        {homeDir && <GlobalSkillsSection homeDir={homeDir} />}
        {homeDir && <GlobalInstructionsSection homeDir={homeDir} />}
        <RepoManager />
      </div>
    </div>
  )
}
