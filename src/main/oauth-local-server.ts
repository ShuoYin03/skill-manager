import http from 'http'
import type { AddressInfo } from 'net'

// Fixed port registered in Supabase's allowed redirect URLs.
// If busy, we try a few alternatives.
const PREFERRED_PORT = 57235
const FALLBACK_PORTS = [57236, 57237, 57238]

export interface OAuthServer {
  callbackUrl: string
  waitForCode: () => Promise<string | null>
  shutdown: () => void
}

export async function startOAuthServer(): Promise<OAuthServer> {
  for (const port of [PREFERRED_PORT, ...FALLBACK_PORTS]) {
    try {
      return await tryStart(port)
    } catch {
      // port in use — try next
    }
  }
  throw new Error('Could not bind to any OAuth callback port (57235-57238)')
}

function tryStart(port: number): Promise<OAuthServer> {
  return new Promise((resolve, reject) => {
    let pendingResolve: ((code: string | null) => void) | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const server = http.createServer((req, res) => {
      if (!req.url) { res.writeHead(400); res.end(); return }

      const url = new URL(req.url, `http://localhost:${port}`)

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code')
        const errorParam = url.searchParams.get('error')

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(code ? successHtml() : errorHtml(errorParam ?? 'unknown'))

        if (pendingResolve) {
          if (timeoutId) clearTimeout(timeoutId)
          pendingResolve(code)
          pendingResolve = null
        }

        // Shut down the server after the response is sent
        setTimeout(() => server.close(), 1500)
      } else {
        res.writeHead(404); res.end()
      }
    })

    server.once('error', reject)

    server.listen(port, '127.0.0.1', () => {
      const actualPort = (server.address() as AddressInfo).port

      resolve({
        callbackUrl: `http://localhost:${actualPort}/callback`,

        waitForCode: () =>
          new Promise<string | null>((res) => {
            pendingResolve = res
            // Auto-cancel after 10 minutes
            timeoutId = setTimeout(() => {
              if (pendingResolve) { pendingResolve(null); pendingResolve = null }
            }, 10 * 60 * 1000)
          }),

        shutdown: () => {
          if (pendingResolve) { pendingResolve(null); pendingResolve = null }
          try { server.close() } catch { /* ignore */ }
        },
      })
    })
  })
}

function successHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Signed in — Skilly</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
      background: #FAFAFA;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    .card {
      background: #fff; border: 1px solid #E5E7EB; border-radius: 16px;
      padding: 40px 32px; text-align: center; max-width: 340px; width: 100%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .icon {
      width: 48px; height: 48px; background: #F0FDF4;
      border: 1px solid #BBF7D0; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
    }
    h2 { color: #0A0A0A; font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    p  { color: #6B7280; font-size: 14px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
           stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    </div>
    <h2>You're signed in</h2>
    <p>Return to Skilly — you can close this tab.</p>
  </div>
</body>
</html>`
}

function errorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Sign-in failed — Skilly</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
      background: #FAFAFA;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    .card {
      background: #fff; border: 1px solid #E5E7EB; border-radius: 16px;
      padding: 40px 32px; text-align: center; max-width: 340px; width: 100%;
    }
    h2 { color: #0A0A0A; font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    p  { color: #6B7280; font-size: 14px; }
    code { font-size: 11px; color: #9CA3AF; display: block; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Sign-in failed</h2>
    <p>Something went wrong. Close this tab and try again.</p>
    <code>${message}</code>
  </div>
</body>
</html>`
}
