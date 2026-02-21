import { app, BrowserWindow } from 'electron'
import { createLauncherWindow } from './window'
import { createTray } from './tray'
import { registerGlobalShortcut, unregisterAllShortcuts } from './shortcut'
import { registerIpcHandlers } from './ipc-handlers'
import { getSettings } from './store'
import { registerProtocolHandler, setupProtocolListener } from './protocol-handler'
import { initSupabase, restoreSession } from './auth-service'
import { initTrial } from './trial-service'

// Register custom protocol before app is ready
registerProtocolHandler()

// Single instance lock (required for protocol handling on Windows/Linux)
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.repo-launcher')

  // Initialize services
  initSupabase()
  initTrial()
  await restoreSession()

  // Initialize subsystems
  registerIpcHandlers()
  createLauncherWindow()
  createTray()
  setupProtocolListener()

  const settings = getSettings()
  registerGlobalShortcut(settings.globalHotkey)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLauncherWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // Don't quit — keep running in tray
})

app.on('before-quit', () => {
  unregisterAllShortcuts()
})
