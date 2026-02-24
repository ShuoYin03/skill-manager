import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/constants'

const api = {
  // Repos
  getRepos: () => ipcRenderer.invoke(IPC.REPOS_GET_ALL),
  addRepo: () => ipcRenderer.invoke(IPC.REPOS_ADD),
  removeRepo: (id: string) => ipcRenderer.invoke(IPC.REPOS_REMOVE, id),
  updateRepo: (id: string, updates: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.REPOS_UPDATE, id, updates),
  refreshBranches: () => ipcRenderer.invoke(IPC.REPOS_REFRESH_BRANCHES),

  // Editors
  openInEditor: (repoId: string, editorId?: string) =>
    ipcRenderer.invoke(IPC.EDITOR_OPEN, repoId, editorId),
  getAvailableEditors: () => ipcRenderer.invoke(IPC.EDITOR_GET_AVAILABLE),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
  updateSettings: (updates: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.SETTINGS_UPDATE, updates),

  // Window
  hideLauncher: () => ipcRenderer.invoke(IPC.WINDOW_HIDE),
  getHomeDir: () => ipcRenderer.invoke(IPC.GET_HOME_DIR),
  openMarketplaceWindow: () => ipcRenderer.invoke(IPC.MARKETPLACE_OPEN),

  // Events from main
  onLauncherShown: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on(IPC.LAUNCHER_SHOWN, handler)
    return () => {
      ipcRenderer.removeListener(IPC.LAUNCHER_SHOWN, handler)
    }
  },
  onLauncherHidden: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on(IPC.LAUNCHER_HIDDEN, handler)
    return () => {
      ipcRenderer.removeListener(IPC.LAUNCHER_HIDDEN, handler)
    }
  },
  onNavigateSettings: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on(IPC.NAVIGATE_SETTINGS, handler)
    return () => {
      ipcRenderer.removeListener(IPC.NAVIGATE_SETTINGS, handler)
    }
  },

  // Auth
  signIn: () => ipcRenderer.invoke(IPC.AUTH_SIGN_IN),
  signOut: () => ipcRenderer.invoke(IPC.AUTH_SIGN_OUT),
  getSession: () => ipcRenderer.invoke(IPC.AUTH_GET_SESSION),
  onAuthCallback: (callback: (user: { email: string; displayName: string | null; avatarUrl: string | null }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, user: { email: string; displayName: string | null; avatarUrl: string | null }): void => callback(user)
    ipcRenderer.on(IPC.AUTH_CALLBACK_RECEIVED, handler)
    return () => {
      ipcRenderer.removeListener(IPC.AUTH_CALLBACK_RECEIVED, handler)
    }
  },

  // License
  getLicenseStatus: () => ipcRenderer.invoke(IPC.LICENSE_GET_STATUS),
  verifyLicense: () => ipcRenderer.invoke(IPC.LICENSE_VERIFY),

  // Skills
  scanRepoSkills: (repoId: string, repoPath: string) =>
    ipcRenderer.invoke(IPC.SKILLS_SCAN_REPO, repoId, repoPath),
  scanAllSkills: () => ipcRenderer.invoke(IPC.SKILLS_SCAN_ALL),
  createSkill: (repoPath: string, tool: string, name: string, content: string) =>
    ipcRenderer.invoke(IPC.SKILLS_CREATE, repoPath, tool, name, content),
  updateSkill: (repoPath: string, skill: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.SKILLS_UPDATE, repoPath, skill),
  deleteSkill: (repoPath: string, skill: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.SKILLS_DELETE, repoPath, skill),
  toggleSkill: (repoPath: string, skill: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.SKILLS_TOGGLE, repoPath, skill),
  globalizeSkill: (skill: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.SKILLS_GLOBALIZE, skill),

  // Presets
  getSkillPresets: () => ipcRenderer.invoke(IPC.SKILLS_PRESETS_GET),
  saveSkillPreset: (preset: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.SKILLS_PRESETS_SAVE, preset),
  updateSkillPreset: (preset: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.SKILLS_PRESETS_UPDATE, preset),
  deleteSkillPreset: (id: string) =>
    ipcRenderer.invoke(IPC.SKILLS_PRESETS_DELETE, id),
  applySkillPreset: (presetId: string, repoPath: string) =>
    ipcRenderer.invoke(IPC.SKILLS_PRESETS_APPLY, presetId, repoPath),

  // Marketplace
  searchMarketplace: (params: { query?: string; tag?: string; author?: string; page: number; pageSize: number }) =>
    ipcRenderer.invoke(IPC.SKILLS_MARKETPLACE_SEARCH, params),
  getMarketplaceFilterStats: () =>
    ipcRenderer.invoke(IPC.SKILLS_MARKETPLACE_FILTER_STATS),
  getMarketplaceSkill: (slug: string) =>
    ipcRenderer.invoke(IPC.SKILLS_MARKETPLACE_GET, slug),
  installMarketplaceSkill: (repoPath: string, tool: string, name: string, content: string, skillsDir?: 'tool-specific' | 'shared') =>
    ipcRenderer.invoke(IPC.SKILLS_MARKETPLACE_INSTALL, repoPath, tool, name, content, skillsDir),
  // Instruction files
  scanInstructionFiles: (repoPath: string) =>
    ipcRenderer.invoke(IPC.INSTRUCTIONS_SCAN, repoPath),
  readInstructionFile: (repoPath: string, tool: string) =>
    ipcRenderer.invoke(IPC.INSTRUCTIONS_READ, repoPath, tool),
  writeInstructionFile: (repoPath: string, tool: string, content: string) =>
    ipcRenderer.invoke(IPC.INSTRUCTIONS_WRITE, repoPath, tool, content),
  globalizeInstructionFile: (repoPath: string, tool: string) =>
    ipcRenderer.invoke(IPC.INSTRUCTIONS_GLOBALIZE, repoPath, tool),

}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
