
'use server'

import { createClient } from '@/utils/supabase/server'

export async function getMyProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null }

  // Pull the joined org (source of truth) alongside the user row
  const { data, error } = await supabase
    .from('Users')
    .select('*, orgs(id, name, tricode, logo, link)')
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
  player_image: string
  org_id: number | null
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
      player_image: form.player_image || null,
      org_id: form.org_id,          // ← org is now a link, not text
    })
    .eq('auth_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}
