import Store from 'electron-store'
import type { StoreSchema, RepoEntry, AppSettings, AuthTokens, LicenseCache, SkillPreset } from '../shared/types'

const store = new Store<StoreSchema>({
  defaults: {
    repos: [],
    settings: {
      globalHotkey: 'CommandOrControl+Shift+O',
      defaultEditor: 'vscode',
      theme: 'system',
      launchAtLogin: false,
      skillsDir: 'tool-specific'
    },
    trialStartedAt: null,
    authTokens: null,
    licenseCache: null,
    skillPresets: []
  }
})

// Repos
export function getRepos(): RepoEntry[] {
  return store.get('repos')
}

export function setRepos(repos: RepoEntry[]): void {
  store.set('repos', repos)
}

export function addRepo(repo: RepoEntry): void {
  const repos = getRepos()
  repos.push(repo)
  setRepos(repos)
}

export function removeRepo(id: string): void {
  const repos = getRepos().filter((r) => r.id !== id)
  setRepos(repos)
}

export function updateRepo(id: string, updates: Partial<RepoEntry>): void {
  const repos = getRepos().map((r) => (r.id === id ? { ...r, ...updates } : r))
  setRepos(repos)
}

// Settings
export function getSettings(): AppSettings {
  return store.get('settings')
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const updated = { ...current, ...updates }
  store.set('settings', updated)
  return updated
}

// Trial
export function getTrialStartedAt(): number | null {
  return store.get('trialStartedAt')
}

export function setTrialStartedAt(ts: number): void {
  store.set('trialStartedAt', ts)
}

// Auth
export function getAuthTokens(): AuthTokens | null {
  return store.get('authTokens')
}

export function setAuthTokens(tokens: AuthTokens): void {
  store.set('authTokens', tokens)
}

export function clearAuthTokens(): void {
  store.set('authTokens', null)
}

// License cache
export function getLicenseCache(): LicenseCache | null {
  return store.get('licenseCache')
}

export function setLicenseCache(cache: LicenseCache): void {
  store.set('licenseCache', cache)
}

export function clearLicenseCache(): void {
  store.set('licenseCache', null)
}

// Skill Presets
export function getSkillPresets(): SkillPreset[] {
  return store.get('skillPresets')
}

export function addSkillPreset(preset: SkillPreset): void {
  const presets = getSkillPresets()
  presets.push(preset)
  store.set('skillPresets', presets)
}

export function removeSkillPreset(id: string): void {
  const presets = getSkillPresets().filter((p) => p.id !== id)
  store.set('skillPresets', presets)
}

export function updateSkillPreset(preset: SkillPreset): void {
  const presets = getSkillPresets().map((p) => (p.id === preset.id ? preset : p))
  store.set('skillPresets', presets)
}
