import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Pass tokens to the success page so it can deep-link back into the app
    if (data.session) {
      const params = new URLSearchParams({
        at: data.session.access_token,
        rt: data.session.refresh_token,
      })
      return NextResponse.redirect(new URL(`/auth/success?${params}`, req.url))
    }
  }

  // If a specific next URL was requested (web flow), respect it
  if (next && next !== '/') {
    return NextResponse.redirect(new URL(next, req.url))
  }

  return NextResponse.redirect(new URL('/auth/success', req.url))
}
