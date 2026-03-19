import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const electronState = searchParams.get('es')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data.session) {
      // Push tokens directly to the waiting Electron app via Supabase Realtime broadcast.
      // The Electron app subscribed to this channel before opening the browser, so it
      // receives the tokens immediately — no user click needed.
      if (electronState) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            messages: [{
              topic: `auth-${electronState}`,
              event: 'tokens',
              payload: {
                at: data.session.access_token,
                rt: data.session.refresh_token,
              },
            }],
          }),
        }).catch(err => console.warn('Realtime broadcast failed:', err))

        // Electron flow: pass tokens to success page for deep-link fallback
        const params = new URLSearchParams({
          at: data.session.access_token,
          rt: data.session.refresh_token,
        })
        return NextResponse.redirect(new URL(`/auth/success?${params}`, req.url))
      }

      // Web flow (e.g. pricing page checkout): redirect to `next` if provided
      if (next && next !== '/') {
        return NextResponse.redirect(new URL(next, req.url))
      }

      // Default fallback: pass tokens to success page for deep-link
      const params = new URLSearchParams({
        at: data.session.access_token,
        rt: data.session.refresh_token,
      })
      return NextResponse.redirect(new URL(`/auth/success?${params}`, req.url))
    }
  }

  if (next && next !== '/') {
    return NextResponse.redirect(new URL(next, req.url))
  }

  return NextResponse.redirect(new URL('/auth/success', req.url))
}
