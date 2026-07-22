import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      const provider = user.app_metadata?.provider ?? 'email'

      await supabase.from('Users').upsert(
        {
          player_email: user.email,
          player_name:
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            'Player',
          player_image: user.user_metadata?.avatar_url ?? null,
          discord_id:
            provider === 'discord'
              ? user.user_metadata?.provider_id ?? null
              : null,                                           
          auth_provider: provider,                              
        },
        { onConflict: 'player_email' }
      )
    }
  }

  return NextResponse.redirect(`${origin}/`)
}