import { ipcMain, dialog } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { IPC } from '../shared/constants'
import type { EditorId, RepoEntry, AITool, SkillFile, SkillPreset, SkillSearchParams } from '../shared/types'
import { getRepos, addRepo, removeRepo, updateRepo, getSettings, updateSettings, getSkillPresets, addSkillPreset, removeSkillPreset, updateSkillPreset } from './store'
import { getGitBranch, isGitRepo, refreshAllBranches } from './git-service'
import { openInEditor, getAvailableEditors } from './editor-launcher'
import { hideLauncher } from './window'
import { updateShortcut } from './shortcut'
import { signIn, signOut, getSession } from './auth-service'
import { verifyLicense } from './license-service'
import { scanRepoSkills } from './skills-scanner'
import { createSkill, updateSkill, deleteSkill, toggleSkill, globalizeSkill, installSkillFromGitHub } from './skills-io'
import { searchMarketplaceSkills, getMarketplaceSkillContent, getMarketplaceFilterStats } from './skills-marketplace'
import { scanMemoryFiles, readMemoryFile, writeMemoryFile, globalizeMemoryFile } from './memory-files'
import type { MemoryTool } from './memory-files'
import { app } from 'electron'
import path from 'path'
import os from 'os'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.REPOS_GET_ALL, async () => {
    const repos = getRepos()
    return await refreshAllBranches(repos)
  })

  ipcMain.handle(IPC.REPOS_ADD, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const folderPath = result.filePaths[0]
    const isGit = await isGitRepo(folderPath)
    const branch = isGit ? await getGitBranch(folderPath) : null

    const entry: RepoEntry = {
      id: uuidv4(),
      name: path.basename(folderPath),
      path: folderPath,
      tags: [],
      editorOverride: null,
      lastOpened: null,
      gitBranch: branch,
      isGitRepo: isGit,
      addedAt: Date.now()
    }

    addRepo(entry)
    return entry
  })

  ipcMain.handle(IPC.REPOS_REMOVE, (_event, id: string) => {
    removeRepo(id)
  })

  ipcMain.handle(IPC.REPOS_UPDATE, (_event, id: string, updates: Partial<RepoEntry>) => {
    updateRepo(id, updates)
  })

  ipcMain.handle(IPC.REPOS_REFRESH_BRANCHES, async () => {
    const repos = getRepos()
    return await refreshAllBranches(repos)
  })

  ipcMain.handle(IPC.EDITOR_OPEN, (_event, repoId: string, editorId?: EditorId) => {
    const repos = getRepos()
    const repo = repos.find((r) => r.id === repoId)
    if (!repo) return

    const settings = getSettings()
    const editor = editorId || repo.editorOverride || settings.defaultEditor
    openInEditor(repo.path, editor)

    updateRepo(repoId, { lastOpened: Date.now() })
    hideLauncher()
  })

  ipcMain.handle(IPC.EDITOR_GET_AVAILABLE, () => {
    return getAvailableEditors()
  })

  ipcMain.handle(IPC.SETTINGS_GET, () => {
    return getSettings()
  })

  ipcMain.handle(IPC.SETTINGS_UPDATE, (_event, updates: Partial<import('../shared/types').AppSettings>) => {
    if (updates.globalHotkey) {
      const success = updateShortcut(updates.globalHotkey)
      if (!success) {
        return { error: 'Failed to register hotkey', settings: getSettings() }
      }
    }

    if (updates.launchAtLogin !== undefined) {
      app.setLoginItemSettings({ openAtLogin: updates.launchAtLogin })
    }

    const newSettings = updateSettings(updates)
    return { settings: newSettings }
  })

  ipcMain.handle(IPC.WINDOW_HIDE, () => {
    hideLauncher()
  })

  ipcMain.handle(IPC.GET_HOME_DIR, () => {
    return os.homedir()
  })

  // Auth
  ipcMain.handle(IPC.AUTH_SIGN_IN, async () => {
    await signIn()
  })

  ipcMain.handle(IPC.AUTH_SIGN_OUT, async () => {
    await signOut()
  })

  ipcMain.handle(IPC.AUTH_GET_SESSION, async () => {
    const session = await getSession()
    if (!session) return null
    return {
      email: session.user.email ?? null,
      displayName: session.user.user_metadata?.full_name ?? null,
      avatarUrl: session.user.user_metadata?.avatar_url ?? null
    }
  })

  // License
  ipcMain.handle(IPC.LICENSE_GET_STATUS, async () => {
    return await verifyLicense()
  })

  ipcMain.handle(IPC.LICENSE_VERIFY, async () => {
    return await verifyLicense()
  })

  // Skills
  ipcMain.handle(IPC.SKILLS_SCAN_REPO, async (_event, repoId: string, repoPath: string) => {
    const { skillsDir } = getSettings()
    return await scanRepoSkills(repoId, repoPath, skillsDir)
  })

  ipcMain.handle(IPC.SKILLS_SCAN_ALL, async () => {
    const repos = getRepos()
    const results = await Promise.all(
      repos.map((r) => scanRepoSkills(r.id, r.path))
    )
    return results
  })

  ipcMain.handle(IPC.SKILLS_CREATE, async (_event, repoPath: string, tool: AITool, name: string, content: string) => {
    const { skillsDir } = getSettings()
    return await createSkill(repoPath, tool, name, content, skillsDir)
  })

  ipcMain.handle(IPC.SKILLS_UPDATE, async (_event, repoPath: string, skill: SkillFile) => {
    await updateSkill(repoPath, skill)
  })

  ipcMain.handle(IPC.SKILLS_DELETE, async (_event, repoPath: string, skill: SkillFile) => {
    await deleteSkill(repoPath, skill)
  })

  ipcMain.handle(IPC.SKILLS_TOGGLE, async (_event, repoPath: string, skill: SkillFile) => {
    return await toggleSkill(repoPath, skill)
  })

  ipcMain.handle(IPC.SKILLS_GLOBALIZE, async (_event, skill: SkillFile) => {
    const repos = getRepos()
    const { skillsDir } = getSettings()
    const allPaths = repos.map((r) => r.path)
    return await globalizeSkill(skill, allPaths, skillsDir)
  })

  // Presets
  ipcMain.handle(IPC.SKILLS_PRESETS_GET, () => {
    return getSkillPresets()
  })

  ipcMain.handle(IPC.SKILLS_PRESETS_SAVE, (_event, preset: SkillPreset) => {
    addSkillPreset(preset)
  })

  ipcMain.handle(IPC.SKILLS_PRESETS_UPDATE, (_event, preset: SkillPreset) => {
    updateSkillPreset(preset)
  })

  ipcMain.handle(IPC.SKILLS_PRESETS_DELETE, (_event, id: string) => {
    removeSkillPreset(id)
  })

  ipcMain.handle(IPC.SKILLS_PRESETS_APPLY, async (_event, presetId: string, repoPath: string) => {
    const presets = getSkillPresets()
    const preset = presets.find((p) => p.id === presetId)
    if (!preset) return { error: 'Preset not found' }

    const created: SkillFile[] = []
    for (const s of preset.skills) {
      const skill = await createSkill(repoPath, s.tool, s.name, s.content)
      created.push(skill)
    }
    return { created }
  })

  // Marketplace
  ipcMain.handle(IPC.SKILLS_MARKETPLACE_SEARCH, async (_event, params: SkillSearchParams) => {
    return await searchMarketplaceSkills(params)
  })

  ipcMain.handle(IPC.SKILLS_MARKETPLACE_FILTER_STATS, async () => {
    return await getMarketplaceFilterStats()
  })

  ipcMain.handle(IPC.SKILLS_MARKETPLACE_GET, async (_event, slug: string) => {
    return await getMarketplaceSkillContent(slug)
  })

  ipcMain.handle(IPC.SKILLS_MARKETPLACE_INSTALL, async (_event, repoPath: string, tool: AITool, name: string, content: string, skillsDir?: 'tool-specific' | 'shared') => {
    // If name is a full slug (owner/repo/skillId), use git-based multi-file install
    if (name.split('/').length >= 3) {
      return await installSkillFromGitHub(name, repoPath, tool, skillsDir ?? 'tool-specific')
    }
    // Fallback: single-file install (for user-created skills with just a name)
    return await createSkill(repoPath, tool, name, content, skillsDir ?? 'tool-specific')
  })

  // Instruction files
  ipcMain.handle(IPC.INSTRUCTIONS_SCAN, async (_event, repoPath: string) => {
    return await scanMemoryFiles(repoPath)
  })

  ipcMain.handle(IPC.INSTRUCTIONS_READ, async (_event, repoPath: string, tool: MemoryTool) => {
    return await readMemoryFile(repoPath, tool)
  })

  ipcMain.handle(IPC.INSTRUCTIONS_WRITE, async (_event, repoPath: string, tool: MemoryTool, content: string) => {
    await writeMemoryFile(repoPath, tool, content)
  })

  ipcMain.handle(IPC.INSTRUCTIONS_GLOBALIZE, async (_event, repoPath: string, tool: MemoryTool) => {
    const repos = getRepos()
    const allPaths = repos.map((r) => r.path)
    return await globalizeMemoryFile(repoPath, tool, allPaths)
  })

}
