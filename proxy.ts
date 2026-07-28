import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  // Refreshes the auth token so sessions don't expire mid-use
  const { data: { user } } = await supabase.auth.getUser()

  // Hard gate: a Steam user (their auth email is the @steam.local placeholder)
  // must provide a real email before using the app. Exempt the email page
  // itself and all auth routes (login + OAuth/Steam callbacks) to avoid loops.
  const path = request.nextUrl.pathname
  const exempt = path.startsWith('/profile/email') || path.startsWith('/auth')
  if (user && !exempt && user.email?.endsWith('@steam.local')) {
    const { data: row } = await supabase
      .from('Users')
      .select('player_email')
      .eq('auth_id', user.id)
      .maybeSingle()
    const hasRealEmail = !!row?.player_email && !row.player_email.endsWith('@steam.local')
    if (!hasRealEmail) {
      const url = request.nextUrl.clone()
      url.pathname = '/profile/email'
      const redirect = NextResponse.redirect(url)
      // Carry over the refreshed auth cookies so the session isn't dropped
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
      return redirect
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}