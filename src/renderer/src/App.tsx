import { useEffect } from 'react'
import { AppProvider, useAppContext } from './context/AppContext'
import { useTheme } from './hooks/useTheme'
import { LauncherView } from './components/Launcher/LauncherView'
import { SettingsView } from './components/Settings/SettingsView'
import { MarketplaceStandaloneView } from './components/Skills/MarketplaceStandaloneView'

const isMarketplaceWindow = window.location.hash === '#view=marketplace'

function AppInner(): JSX.Element {
  const { state, dispatch } = useAppContext()
  useTheme(state.settings.theme)

  // Load initial data
  useEffect(() => {
    async function init(): Promise<void> {
      const [repos, settings, editors, licenseStatus, session] = await Promise.all([
        window.electronAPI.getRepos(),
        window.electronAPI.getSettings(),
        window.electronAPI.getAvailableEditors(),
        window.electronAPI.getLicenseStatus(),
        window.electronAPI.getSession()
      ])
      dispatch({ type: 'SET_REPOS', payload: repos })
      dispatch({ type: 'SET_SETTINGS', payload: settings })
      dispatch({ type: 'SET_EDITORS', payload: editors })
      dispatch({ type: 'SET_LICENSE_STATUS', payload: licenseStatus })
      if (session) {
        dispatch({ type: 'SET_AUTH_USER', payload: session })
      }
      dispatch({ type: 'SET_LOADING', payload: false })
    }
    init()
  }, [dispatch])

  // Listen for main process events
  useEffect(() => {
    const unsubShown = window.electronAPI.onLauncherShown(async () => {
      // Refresh repos (and branches) when launcher is shown
      const repos = await window.electronAPI.getRepos()
      dispatch({ type: 'SET_REPOS', payload: repos })
      dispatch({ type: 'RESET_LAUNCHER' })
    })

    const unsubHidden = window.electronAPI.onLauncherHidden(() => {
      // Reset search state when hidden
    })

    const unsubSettings = window.electronAPI.onNavigateSettings(() => {
      dispatch({ type: 'SET_VIEW', payload: 'settings' })
    })

    const unsubAuth = window.electronAPI.onAuthCallback(async (user) => {
      dispatch({ type: 'SET_AUTH_USER', payload: user })
      // Re-verify license after auth callback
      const licenseStatus = await window.electronAPI.getLicenseStatus()
      dispatch({ type: 'SET_LICENSE_STATUS', payload: licenseStatus })
    })

    return () => {
      unsubShown()
      unsubHidden()
      unsubSettings()
      unsubAuth()
    }
  }, [dispatch])

  if (state.isLoading) {
    return <div />
  }

  return (
    <div className="launcher-container">
      {state.currentView === 'launcher' ? <LauncherView /> : <SettingsView />}
    </div>
  )
}

export default function App(): JSX.Element {
  if (isMarketplaceWindow) {
    return <MarketplaceStandaloneView />
  }

  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
