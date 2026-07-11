
'use server'

import { createClient } from '@/utils/supabase/server'

export async function getMyProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null }

  const { data, error } = await supabase
    .from('Users')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (error) return { error: error.message, data: null }
  return { data }
}

export type ProfileForm = {
  player_name: string
  handle: string
  game: string
  region: string
  org_name: string
  org_tricode: string
  org_link: string
  player_image: string
}

export async function updateProfile(form: ProfileForm) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const { error } = await supabase
    .from('Users')
    .update({
      player_name: form.player_name || null,
      handle: form.handle || null,
      game: form.game || null,
      region: form.region || null,
      org_name: form.org_name || null,
      org_tricode: form.org_tricode || null,
      org_link: form.org_link || null,
      player_image: form.player_image || null,
    })
    .eq('auth_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}