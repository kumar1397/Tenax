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

  // Hard gate for signed-in users: first-timers must complete onboarding.
  // Onboarding also captures their email (Steam gives a placeholder, and some
  // Discord accounts have none), so no separate email gate is needed.
  const path = request.nextUrl.pathname
  const exempt =
    path.startsWith('/profile/onboarding') ||
    path.startsWith('/auth')

  if (user && !exempt) {
    const { data: row } = await supabase
      .from('Users')
      .select('handle')
      .eq('auth_id', user.id)
      .maybeSingle()

    // A handle is the "onboarded" marker.
    if (!row?.handle) {
      const url = request.nextUrl.clone()
      url.pathname = '/profile/onboarding'
      const redirect = NextResponse.redirect(url)
      // Carry over the refreshed auth cookies so the session isn't dropped
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
      return redirect
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|GC.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}