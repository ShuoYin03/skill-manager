import { app, BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import { IPC } from '../shared/constants'
import { getSettings, setWindowBounds, getWindowBounds } from './store'

let launcherWindow: BrowserWindow | null = null
let suppressHide = false
let boundsDebounceTimer: ReturnType<typeof setTimeout> | null = null

export function setSuppressHide(v: boolean): void {
  suppressHide = v
}

export function createLauncherWindow(): BrowserWindow {
  const settings = getSettings()
  const savedBounds = settings.rememberWindowSize ? getWindowBounds() : null

  const win = new BrowserWindow({
    width: savedBounds?.width ?? 900,
    height: savedBounds?.height ?? 600,
    minWidth: 600,
    minHeight: 400,
    frame: false,
    transparent: true,
    resizable: true,
    movable: true,
    minimizable: false,
    maximizable: true,
    fullscreenable: false,
    alwaysOnTop: settings.alwaysOnTop ?? true,
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

  // Save window bounds on resize/move (debounced)
  const saveBounds = (): void => {
    if (!getSettings().rememberWindowSize) return
    if (boundsDebounceTimer) clearTimeout(boundsDebounceTimer)
    boundsDebounceTimer = setTimeout(() => {
      const bounds = win.getBounds()
      setWindowBounds(bounds)
    }, 500)
  }
  win.on('resize', saveBounds)
  win.on('move', saveBounds)

  win.on('blur', () => {
    if (suppressHide) return
    setTimeout(() => {
      if (suppressHide) return
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

  const settings = getSettings()
  const savedBounds = settings.rememberWindowSize ? getWindowBounds() : null

  if (savedBounds) {
    // Restore saved position and size
    launcherWindow.setBounds(savedBounds)
  } else {
    // Center on the display where the cursor is
    const cursorPoint = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint(cursorPoint)
    const { x, y, width, height } = display.workArea
    const winBounds = launcherWindow.getBounds()
    const cx = Math.round(x + (width - winBounds.width) / 2)
    const cy = Math.round(y + (height - winBounds.height) / 2 - height * 0.1)
    launcherWindow.setPosition(cx, cy)
  }

  launcherWindow.show()
  launcherWindow.focus()
  launcherWindow.webContents.send(IPC.LAUNCHER_SHOWN)
}

export function applyAlwaysOnTop(value: boolean): void {
  if (!launcherWindow) return
  launcherWindow.setAlwaysOnTop(value)
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
