import { globalShortcut } from 'electron'
import { toggleLauncher } from './window'

let currentAccelerator: string | null = null

export function registerGlobalShortcut(accelerator: string): boolean {
  try {
    const success = globalShortcut.register(accelerator, toggleLauncher)
    if (success) {
      currentAccelerator = accelerator
    }
    return success
  } catch {
    return false
  }
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll()
  currentAccelerator = null
}

export function updateShortcut(newAccelerator: string): boolean {
  const old = currentAccelerator
  if (old) {
    globalShortcut.unregister(old)
  }
  const success = registerGlobalShortcut(newAccelerator)
  if (!success && old) {
    // Rollback to old shortcut
    registerGlobalShortcut(old)
  }
  return success
}
