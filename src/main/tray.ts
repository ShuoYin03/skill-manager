import { Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'
import { showLauncher, getLauncherWindow } from './window'
import { IPC } from '../shared/constants'

let tray: Tray | null = null

export function createTray(): Tray {
  let iconPath: string
  if (process.platform === 'darwin') {
    iconPath = join(__dirname, '../../resources/tray-iconTemplate.png')
  } else {
    iconPath = join(__dirname, '../../resources/tray-icon.png')
  }

  // Create a small default icon if the resource doesn't exist
  let icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty()) {
    // Fallback: create a tiny 16x16 icon
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('Repo Launcher')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Launcher',
      click: () => showLauncher()
    },
    {
      label: 'Settings',
      click: () => {
        showLauncher()
        const win = getLauncherWindow()
        if (win) {
          win.webContents.send(IPC.NAVIGATE_SETTINGS)
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Repo Launcher',
      click: () => app.quit()
    }
  ])

  tray.setContextMenu(contextMenu)

  // On macOS, left-click toggles the launcher
  if (process.platform === 'darwin') {
    tray.on('click', () => {
      showLauncher()
    })
  }

  return tray
}
