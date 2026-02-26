import { app, BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import { IPC } from '../shared/constants'

let launcherWindow: BrowserWindow | null = null
const BASE_WIDTH = 900
const BASE_HEIGHT = 600

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
