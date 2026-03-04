import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js'
import { shell } from 'electron'
import { randomUUID } from 'crypto'
import { SUPABASE_URL, SUPABASE_ANON_KEY, WEBSITE_URL } from './config'
import { getAuthTokens, setAuthTokens, clearAuthTokens } from './store'

let supabase: SupabaseClient

export function initSupabase(): void {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: false // We persist manually via electron-store
    }
  })
}

export async function signIn(): Promise<string | null> {
  const stateId = randomUUID()
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${WEBSITE_URL}/auth/callback?es=${stateId}`,
      skipBrowserRedirect: true
    }
  })
  if (data.url) {
    shell.openExternal(data.url)
    return stateId
  }
  return null
}

export async function handleAuthCallback(url: string): Promise<Session | null> {
  // URL format: skilly://auth/callback#access_token=...&refresh_token=...
  const fragment = url.split('#')[1]
  if (!fragment) return null

  const params = new URLSearchParams(fragment)
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')

  if (!access_token || !refresh_token) return null

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
  if (error || !data.session) return null

  setAuthTokens({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token
  })

  return data.session
}

export async function restoreSession(): Promise<Session | null> {
  const tokens = getAuthTokens()
  if (!tokens) return null

  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    })
    if (error || !data.session) {
      clearAuthTokens()
      return null
    }
    // Update stored tokens (they may have been refreshed)
    setAuthTokens({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    })
    return data.session
  } catch {
    return null
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
  clearAuthTokens()
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function getSupabaseClient(): SupabaseClient {
  return supabase
}
