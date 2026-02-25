import { app } from 'electron'
import { handleAuthCallback } from './auth-service'
import { getLauncherWindow, showLauncher } from './window'
import { IPC } from '../shared/constants'

export function registerProtocolHandler(): void {
  if (!app.isDefaultProtocolClient('skilly')) {
    app.setAsDefaultProtocolClient('skilly')
  }
}

export function setupProtocolListener(): void {
  // macOS: protocol URLs arrive via 'open-url'
  app.on('open-url', async (event, url) => {
    event.preventDefault()
    await processAuthUrl(url)
  })

  // Windows/Linux: protocol URLs arrive via second-instance
  app.on('second-instance', async (_event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith('skilly://'))
    if (url) {
      await processAuthUrl(url)
    }
  })
}

async function processAuthUrl(url: string): Promise<void> {
  if (!url.startsWith('skilly://auth/callback')) return

  const session = await handleAuthCallback(url)
  const win = getLauncherWindow()

  if (win && session) {
    win.webContents.send(IPC.AUTH_CALLBACK_RECEIVED, {
      email: session.user.email ?? '',
      displayName: session.user.user_metadata?.full_name ?? null,
      avatarUrl: session.user.user_metadata?.avatar_url ?? null
    })
    showLauncher()
  }
}
