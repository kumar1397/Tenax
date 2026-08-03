
'use server'

import { revalidatePath } from 'next/cache'
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

export type OnboardingForm = {
  player_name: string
  handle: string
  region: string
  org_id: number | null
  player_image: string
  email: string
}

// First-run save. Updates the row created at sign-in, but falls back to an
// insert if that row doesn't exist yet, and surfaces 0-row / RLS failures
// instead of silently "succeeding" (which left the user stuck on the gate).
export async function completeOnboarding(form: OnboardingForm) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const fields = {
    player_name: form.player_name || null,
    handle: form.handle || null,
    region: form.region || null,
    org_id: form.org_id,
    player_image: form.player_image || null,
    // Email captured on the form — Steam gives none, and some Discord accounts
    // have no synced email, so we always collect it here.
    player_email: form.email || null,
  }

  const { data: updated, error: updErr } = await supabase
    .from('Users')
    .update(fields)
    .eq('auth_id', user.id)
    .select('id')

  if (updErr) return { error: updErr.message }

  if (!updated || updated.length === 0) {
    const { error: insErr } = await supabase
      .from('Users')
      .insert({ auth_id: user.id, ...fields })
    if (insErr) return { error: insErr.message }
  }

  revalidatePath('/')
  return { success: true }
}


export async function saveContactEmail(contactEmail: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not signed in" };

  const { error } = await supabase
    .from("Users")
    .update({ player_email: contactEmail })
    .eq("auth_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}