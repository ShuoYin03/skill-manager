export type EditorId =
  | 'vscode'
  | 'cursor'
  | 'webstorm'
  | 'rider'
  | 'pycharm'
  | 'intellij'
  | 'goland'
  | 'clion'
  | 'phpstorm'
  | 'rustrover'
  | 'zed'
  | 'sublime'
  | 'neovim'
  | 'terminal'
  | 'finder'

export interface EditorDefinition {
  id: EditorId
  label: string
  command: string
  platforms: NodeJS.Platform[]
}

export interface RepoEntry {
  id: string
  name: string
  path: string
  tags: string[]
  editorOverride: EditorId | null
  lastOpened: number | null
  gitBranch: string | null
  isGitRepo: boolean
  addedAt: number
}

export interface AppSettings {
  globalHotkey: string
  defaultEditor: EditorId
  theme: 'light' | 'dark' | 'system'
  launchAtLogin: boolean
  skillsDir: 'tool-specific' | 'shared'
  hideAfterOpen: boolean
  alwaysOnTop: boolean
  rememberWindowSize: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LicenseStatus {
  state: 'licensed' | 'trial' | 'expired'
  trialDaysLeft: number | null
  userEmail: string | null
}

export interface LicenseCache {
  status: LicenseStatus
  checkedAt: number
}

export interface AuthUser {
  email: string
  displayName: string | null
  avatarUrl: string | null
}

export interface StoreSchema {
  repos: RepoEntry[]
  settings: AppSettings
  trialStartedAt: number | null
  authTokens: AuthTokens | null
  licenseCache: LicenseCache | null
  skillPresets: SkillPreset[]
  windowBounds: { x: number; y: number; width: number; height: number } | null
}

export type ViewMode = 'launcher' | 'settings' | 'marketplace'

// AI Skills Manager
export type AITool = 'claude' | 'cursor' | 'windsurf' | 'codex' | 'copilot'

export interface SkillFile {
  id: string
  tool: AITool
  name: string
  relativePath: string
  content: string
  enabled: boolean
  frontmatter?: Record<string, unknown>
}

export interface RepoSkills {
  repoId: string
  repoPath: string
  skills: SkillFile[]
  lastScanned: number
}

export interface SkillPreset {
  id: string
  name: string
  description: string
  skills: Array<{
    tool: AITool
    name: string
    content: string
  }>
  // Future: instruction files (CLAUDE.md, .cursorrules, etc.) to optionally include in this preset
  instructions?: Array<{ tool: InstructionTool; content: string }>
}

export interface MarketplaceSkill {
  slug: string
  title: string
  description: string
  author: string
  tags: string[]
  content: string
  downloads?: number
}

export interface SkillSearchParams {
  query?: string
  tags?: string[]    // filter by repo name (collection), multi-select
  author?: string    // filter by owner
  page: number       // 1-indexed
  pageSize: number   // default 24
}

export interface SkillSearchResult {
  skills: MarketplaceSkill[]
  total: number
  page: number
  totalPages: number
  offlineReason?: string // Set when falling back to bundled skills; contains the Supabase error
}

export interface SkillFilterStats {
  tags: { name: string; count: number }[]
  authors: { name: string; count: number }[]
}

export type SkillsPanelView = 'info' | 'list' | 'editor' | 'marketplace' | 'presets' | 'instructions' | 'settings'

// Instruction files (CLAUDE.md, .cursorrules, etc.)
export type InstructionTool = 'claude' | 'cursor' | 'windsurf' | 'copilot'

export interface InstructionFile {
  tool: InstructionTool
  label: string
  relativePath: string
  exists: boolean
  content: string | null
}
