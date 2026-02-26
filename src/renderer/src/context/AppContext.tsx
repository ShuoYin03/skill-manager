import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import type { RepoEntry, AppSettings, EditorDefinition, ViewMode, LicenseStatus, AuthUser, RepoSkills, SkillFile, SkillsPanelView } from '../../../shared/types'

export interface AppState {
  repos: RepoEntry[]
  settings: AppSettings
  editors: EditorDefinition[]
  currentView: ViewMode
  isLoading: boolean
  searchQuery: string
  selectedIndex: number
  activeTagFilter: string | null
  licenseStatus: LicenseStatus | null
  authUser: AuthUser | null
  // Repo selection & detail panel
  selectedRepo: { id: string; path: string; name: string } | null
  repoPanelView: SkillsPanelView
  repoSkills: RepoSkills | null
  editingSkill: SkillFile | null
}

export type AppAction =
  | { type: 'SET_REPOS'; payload: RepoEntry[] }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'SET_EDITORS'; payload: EditorDefinition[] }
  | { type: 'SET_VIEW'; payload: ViewMode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_INDEX'; payload: number }
  | { type: 'SET_TAG_FILTER'; payload: string | null }
  | { type: 'RESET_LAUNCHER' }
  | { type: 'SET_LICENSE_STATUS'; payload: LicenseStatus }
  | { type: 'SET_AUTH_USER'; payload: AuthUser | null }
  | { type: 'SELECT_REPO'; payload: { id: string; path: string; name: string } }
  | { type: 'DESELECT_REPO' }
  | { type: 'SET_SKILLS_PANEL_VIEW'; payload: SkillsPanelView }
  | { type: 'SET_REPO_SKILLS'; payload: RepoSkills }
  | { type: 'SET_EDITING_SKILL'; payload: SkillFile | null }

const initialState: AppState = {
  repos: [],
  settings: {
    globalHotkey: 'CommandOrControl+Shift+O',
    defaultEditor: 'vscode',
    theme: 'system',
    launchAtLogin: false
  },
  editors: [],
  currentView: 'launcher',
  isLoading: true,
  searchQuery: '',
  selectedIndex: 0,
  activeTagFilter: null,
  licenseStatus: null,
  authUser: null,
  selectedRepo: null,
  repoPanelView: 'info',
  repoSkills: null,
  editingSkill: null
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_REPOS':
      return { ...state, repos: action.payload }
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload }
    case 'SET_EDITORS':
      return { ...state, editors: action.payload }
    case 'SET_VIEW':
      return { ...state, currentView: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload, selectedIndex: 0 }
    case 'SET_SELECTED_INDEX':
      return { ...state, selectedIndex: action.payload }
    case 'SET_TAG_FILTER':
      return { ...state, activeTagFilter: action.payload, selectedIndex: 0 }
    case 'RESET_LAUNCHER':
      return {
        ...state,
        searchQuery: '',
        selectedIndex: 0,
        activeTagFilter: null,
        selectedRepo: null,
        repoSkills: null,
        editingSkill: null,
        repoPanelView: 'info'
      }
    case 'SET_LICENSE_STATUS':
      return { ...state, licenseStatus: action.payload }
    case 'SET_AUTH_USER':
      return { ...state, authUser: action.payload }
    case 'SELECT_REPO':
      return {
        ...state,
        selectedRepo: action.payload,
        repoPanelView: 'info',
        editingSkill: null
      }
    case 'DESELECT_REPO':
      return {
        ...state,
        selectedRepo: null,
        repoSkills: null,
        editingSkill: null,
        repoPanelView: 'info'
      }
    case 'SET_SKILLS_PANEL_VIEW':
      return { ...state, repoPanelView: action.payload, editingSkill: null }
    case 'SET_REPO_SKILLS':
      return { ...state, repoSkills: action.payload }
    case 'SET_EDITING_SKILL':
      return {
        ...state,
        editingSkill: action.payload,
        repoPanelView: action.payload ? 'editor' : 'list'
      }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: Dispatch<AppAction>
}>({
  state: initialState,
  dispatch: () => {}
})

export function AppProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppContext(): { state: AppState; dispatch: Dispatch<AppAction> } {
  return useContext(AppContext)
}
