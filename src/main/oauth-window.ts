import { BrowserWindow } from 'electron'
import { WEBSITE_URL } from './config'

const SUCCESS_PATH = '/auth/success'

/**
 * Opens a BrowserWindow to complete OAuth, monitors redirects,
 * and returns { at, rt } tokens when the success page is detected.
 * Returns null if the user closes the window without completing auth.
 */
export function openOAuthWindow(url: string): Promise<{ at: string; rt: string } | null> {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 520,
      height: 680,
      center: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      title: 'Sign in to Skilly',
      autoHideMenuBar: true,
      show: false,
    })

    win.once('ready-to-show', () => win.show())

    let resolved = false

    const tryResolve = (navUrl: string): void => {
      if (resolved) return
      try {
        const parsed = new URL(navUrl)
        // Check if this is the success page with tokens in query params
        if (parsed.origin === new URL(WEBSITE_URL).origin && parsed.pathname === SUCCESS_PATH) {
          const at = parsed.searchParams.get('at')
          const rt = parsed.searchParams.get('rt')
          if (at && rt) {
            resolved = true
            resolve({ at, rt })
            // Small delay so the success page renders before close
            setTimeout(() => {
              if (!win.isDestroyed()) win.close()
            }, 800)
          }
        }
      } catch {
        // ignore malformed URLs
      }
    }

    win.webContents.on('will-redirect', (_event, redirectUrl) => {
      tryResolve(redirectUrl)
    })

    win.webContents.on('did-navigate', (_event, navUrl) => {
      tryResolve(navUrl)
    })

    // Block any attempt to navigate to custom scheme — not needed in this flow
    win.webContents.on('will-navigate', (event, navUrl) => {
      if (navUrl.startsWith('skilly://')) {
        event.preventDefault()
      }
    })

    win.on('closed', () => {
      if (!resolved) resolve(null)
    })

    win.loadURL(url)
  })
}
