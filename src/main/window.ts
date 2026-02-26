import { app, BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import { IPC } from '../shared/constants'

let launcherWindow: BrowserWindow | null = null
let marketplaceWindow: BrowserWindow | null = null
const BASE_WIDTH = 900
const BASE_HEIGHT = 600
// When marketplace opens, the launcher loses focus. Suppress that blur-triggered
// hide so the launcher stays visible while switching between the two windows.
let suppressLauncherHide = false

export function createLauncherWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Apply vibrancy on macOS
  if (process.platform === 'darwin') {
    win.setVibrancy('under-window')
  }

  win.on('blur', () => {
    if (suppressLauncherHide) {
      suppressLauncherHide = false
      return
    }
    // Also don't hide if focus moved to another window in this app (e.g. marketplace)
    setTimeout(() => {
      const focused = BrowserWindow.getFocusedWindow()
      if (!focused) hideLauncher()
    }, 150)
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  launcherWindow = win
  return win
}

export function showLauncher(): void {
  if (!launcherWindow) return

  // Center on the display where the cursor is
  const cursorPoint = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPoint)
  const { x, y, width, height } = display.workArea
  const winBounds = launcherWindow.getBounds()
  const cx = Math.round(x + (width - winBounds.width) / 2)
  const cy = Math.round(y + (height - winBounds.height) / 2 - height * 0.1)
  launcherWindow.setPosition(cx, cy)

  launcherWindow.show()
  launcherWindow.focus()
  launcherWindow.webContents.send(IPC.LAUNCHER_SHOWN)
}

export function hideLauncher(): void {
  if (!launcherWindow || !launcherWindow.isVisible()) return
  launcherWindow.hide()
  launcherWindow.webContents.send(IPC.LAUNCHER_HIDDEN)
}

export function toggleLauncher(): void {
  if (!launcherWindow) return
  if (launcherWindow.isVisible()) {
    hideLauncher()
  } else {
    showLauncher()
  }
}


export function getLauncherWindow(): BrowserWindow | null {
  return launcherWindow
}

export function openMarketplaceWindow(): void {
  if (marketplaceWindow && !marketplaceWindow.isDestroyed()) {
    suppressLauncherHide = true
    marketplaceWindow.focus()
    return
  }

  // Prevent the launcher from hiding when the new marketplace window steals focus
  suppressLauncherHide = true

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    resizable: true,
    frame: true,
    title: 'Skill Marketplace',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  win.on('closed', () => {
    marketplaceWindow = null
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#view=marketplace')
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'view=marketplace' })
  }

  marketplaceWindow = win
}
