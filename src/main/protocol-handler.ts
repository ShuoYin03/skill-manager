import { app } from 'electron'
import { handleAuthCallback, getSupabaseClient } from './auth-service'
import { getLauncherWindow, showLauncher } from './window'
import { setAuthTokens } from './store'
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

export function setupRealtimeAuth(stateId: string): void {
  const supabase = getSupabaseClient()
  const channel = supabase.channel(`auth-${stateId}`)
  let done = false

  channel
    .on('broadcast', { event: 'tokens' }, async (msg: { payload: { at: string; rt: string } }) => {
      if (done) return
      done = true

      const { at, rt } = msg.payload
      const { data, error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt })

      if (!error && data.session) {
        setAuthTokens({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        })
        const win = getLauncherWindow()
        if (win) {
          win.webContents.send(IPC.AUTH_CALLBACK_RECEIVED, {
            email: data.session.user.email ?? '',
            displayName: data.session.user.user_metadata?.full_name ?? null,
            avatarUrl: data.session.user.user_metadata?.avatar_url ?? null
          })
          showLauncher()
        }
      }

      supabase.removeChannel(channel)
    })
    .subscribe()

  // Auto-cleanup after 10 minutes if auth never completes
  setTimeout(() => {
    if (!done) supabase.removeChannel(channel)
  }, 10 * 60 * 1000)
}
