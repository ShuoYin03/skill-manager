import { execSync, spawn } from 'child_process'
import { existsSync } from 'fs'
import type { EditorId, EditorDefinition } from '../shared/types'

const EDITOR_DEFINITIONS: EditorDefinition[] = [
  { id: 'vscode', label: 'VS Code', command: 'code', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'cursor', label: 'Cursor', command: 'cursor', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'webstorm', label: 'WebStorm', command: 'webstorm', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'rider', label: 'Rider', command: 'rider', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'pycharm', label: 'PyCharm', command: 'pycharm', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'intellij', label: 'IntelliJ IDEA', command: 'idea', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'goland', label: 'GoLand', command: 'goland', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'clion', label: 'CLion', command: 'clion', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'phpstorm', label: 'PhpStorm', command: 'phpstorm', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'rustrover', label: 'RustRover', command: 'rustrover', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'zed', label: 'Zed', command: 'zed', platforms: ['darwin', 'linux'] },
  { id: 'sublime', label: 'Sublime Text', command: 'subl', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'neovim', label: 'Neovim', command: 'nvim', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'terminal', label: 'Terminal', command: '', platforms: ['darwin', 'win32', 'linux'] },
  { id: 'finder', label: 'File Manager', command: '', platforms: ['darwin', 'win32', 'linux'] }
]

// JetBrains IDEs that use `open -a` on macOS
const JETBRAINS_IDS: EditorId[] = [
  'webstorm', 'rider', 'pycharm', 'intellij', 'goland', 'clion', 'phpstorm', 'rustrover'
]

// macOS: .app bundle paths for detection and CLI resolution
const MAC_APP_PATHS: Partial<Record<EditorId, string[]>> = {
  vscode: [
    '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
    '/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code-insiders',
    `${process.env.HOME}/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code`
  ],
  cursor: [
    '/Applications/Cursor.app/Contents/Resources/app/bin/cursor',
    `${process.env.HOME}/Applications/Cursor.app/Contents/Resources/app/bin/cursor`
  ],
  sublime: [
    '/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl',
    `${process.env.HOME}/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl`
  ],
  zed: [
    '/Applications/Zed.app/Contents/MacOS/cli',
    `${process.env.HOME}/Applications/Zed.app/Contents/MacOS/cli`
  ]
}

// macOS: .app names for `open -a` based editors (used for detection + launching)
const MAC_APP_NAMES: Partial<Record<EditorId, string[]>> = {
  webstorm: ['WebStorm'],
  rider: ['Rider'],
  pycharm: ['PyCharm', 'PyCharm CE', 'PyCharm Community Edition', 'PyCharm Professional Edition'],
  intellij: ['IntelliJ IDEA', 'IntelliJ IDEA CE', 'IntelliJ IDEA Community Edition', 'IntelliJ IDEA Ultimate'],
  goland: ['GoLand'],
  clion: ['CLion'],
  phpstorm: ['PhpStorm'],
  rustrover: ['RustRover'],
  zed: ['Zed'],
}

/**
 * Check if an editor is installed on the system.
 * Terminal and Finder are always "installed".
 */
function isEditorInstalled(editorId: EditorId): boolean {
  if (editorId === 'terminal' || editorId === 'finder') return true

  if (process.platform === 'darwin') {
    // Check .app bundle CLI paths
    const cliPaths = MAC_APP_PATHS[editorId]
    if (cliPaths) {
      for (const p of cliPaths) {
        if (existsSync(p)) return true
      }
    }

    // Check .app existence in /Applications
    const appNames = MAC_APP_NAMES[editorId]
    if (appNames) {
      for (const name of appNames) {
        if (
          existsSync(`/Applications/${name}.app`) ||
          existsSync(`${process.env.HOME}/Applications/${name}.app`)
        ) {
          return true
        }
      }
    }

    // Fallback: check PATH via `which`
    const def = EDITOR_DEFINITIONS.find((e) => e.id === editorId)
    if (def && def.command) {
      try {
        execSync(`which ${def.command}`, { encoding: 'utf-8', stdio: 'pipe' })
        return true
      } catch {
        // not in PATH
      }
    }

    return false
  }

  // Windows / Linux: check if command is in PATH
  const def = EDITOR_DEFINITIONS.find((e) => e.id === editorId)
  if (!def || !def.command) return false

  try {
    const cmd = process.platform === 'win32' ? `where ${def.command}` : `which ${def.command}`
    execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * Resolve the actual executable path for an editor.
 */
function resolveCommand(editorId: EditorId): string {
  const def = EDITOR_DEFINITIONS.find((e) => e.id === editorId)!

  if (process.platform === 'darwin') {
    const candidates = MAC_APP_PATHS[editorId]
    if (candidates) {
      for (const p of candidates) {
        if (existsSync(p)) return p
      }
    }
    try {
      return execSync(`which ${def.command}`, { encoding: 'utf-8', stdio: 'pipe' }).trim()
    } catch {
      // fall through
    }
  }

  return def.command
}

// Cache the result so we don't re-scan on every call
let cachedAvailable: EditorDefinition[] | null = null

export function getAvailableEditors(): EditorDefinition[] {
  if (cachedAvailable) return cachedAvailable

  cachedAvailable = EDITOR_DEFINITIONS.filter(
    (e) => e.platforms.includes(process.platform) && isEditorInstalled(e.id)
  )
  return cachedAvailable
}

/** Force re-scan (e.g. if user installs a new editor while app is running) */
export function refreshAvailableEditors(): EditorDefinition[] {
  cachedAvailable = null
  return getAvailableEditors()
}

/**
 * Resolve the macOS .app name for a JetBrains IDE (finds the first one that exists).
 */
function resolveJetBrainsAppName(editorId: EditorId): string {
  const names = MAC_APP_NAMES[editorId]
  if (names) {
    for (const name of names) {
      if (
        existsSync(`/Applications/${name}.app`) ||
        existsSync(`${process.env.HOME}/Applications/${name}.app`)
      ) {
        return name
      }
    }
  }
  // Fallback to the label
  const def = EDITOR_DEFINITIONS.find((e) => e.id === editorId)!
  return def.label
}

export function openInEditor(folderPath: string, editorId: EditorId): void {
  const platform = process.platform

  if (JETBRAINS_IDS.includes(editorId)) {
    if (platform === 'darwin') {
      const appName = resolveJetBrainsAppName(editorId)
      spawnDetached('open', ['-a', appName, folderPath])
    } else {
      const cmd = resolveCommand(editorId)
      spawnDetached(cmd, [folderPath])
    }
    return
  }

  switch (editorId) {
    case 'vscode':
    case 'cursor': {
      const cmd = resolveCommand(editorId)
      spawnDetached(cmd, [folderPath])
      break
    }
    case 'zed': {
      const cmd = resolveCommand(editorId)
      spawnDetached(cmd, [folderPath])
      break
    }
    case 'sublime': {
      const cmd = resolveCommand(editorId)
      spawnDetached(cmd, [folderPath])
      break
    }
    case 'neovim': {
      if (platform === 'darwin') {
        // Open a terminal with nvim inside
        spawnDetached('open', ['-a', 'Terminal', folderPath])
      } else if (platform === 'win32') {
        spawnDetached('cmd.exe', ['/c', 'start', 'cmd', '/K', `cd /d "${folderPath}" && nvim .`], {
          shell: true
        })
      } else {
        spawnDetached('x-terminal-emulator', ['-e', `cd "${folderPath}" && nvim .`])
      }
      break
    }
    case 'terminal': {
      if (platform === 'darwin') {
        spawnDetached('open', ['-a', 'Terminal', folderPath])
      } else if (platform === 'win32') {
        spawnDetached('cmd.exe', ['/c', 'start', 'cmd', '/K', `cd /d "${folderPath}"`], {
          shell: true
        })
      } else {
        spawnDetached('x-terminal-emulator', ['--working-directory', folderPath])
      }
      break
    }
    case 'finder': {
      if (platform === 'darwin') {
        spawnDetached('open', [folderPath])
      } else if (platform === 'win32') {
        spawnDetached('explorer', [folderPath])
      } else {
        spawnDetached('xdg-open', [folderPath])
      }
      break
    }
  }
}

function spawnDetached(
  command: string,
  args: string[],
  options?: { shell?: boolean }
): void {
  try {
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      shell: options?.shell ?? false
    })
    child.on('error', (err) => {
      console.error(`Failed to launch ${command}:`, err.message)
    })
    child.unref()
  } catch (err) {
    console.error(`Failed to spawn ${command}:`, err)
  }
}
