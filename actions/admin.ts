'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

// Admin-only: delete a player. Removes their registrations, their Users profile
// row, and their auth account. Verified via the caller's session, executed with
// the service-role client.
// Admin-only: promote a player to admin (or demote back to player).
export async function setPlayerRole(userId: number, role: 'admin' | 'user') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { data: me } = await supabase
    .from('Users')
    .select('id, role')
    .eq('auth_id', user.id)
    .single()
  if (me?.role !== 'admin') return { error: 'Only admins can change roles.' }
  if (me.id === userId) return { error: "You can't change your own role." }

  const admin = createAdminClient()
  const { error } = await admin.from('Users').update({ role }).eq('id', userId)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function deletePlayer(userId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { data: me } = await supabase
    .from('Users')
    .select('id, role')
    .eq('auth_id', user.id)
    .single()
  if (me?.role !== 'admin') return { error: 'Only admins can delete players.' }
  if (me.id === userId) return { error: "You can't delete your own profile here." }

  const admin = createAdminClient()

  // Grab the auth id before deleting the row so we can remove the login too
  const { data: target } = await admin.from('Users').select('auth_id').eq('id', userId).single()

  await admin.from('event_participants').delete().eq('player_id', userId)
  const { error } = await admin.from('Users').delete().eq('id', userId)
  if (error) return { error: error.message }

  if (target?.auth_id) {
    // Best-effort: remove the auth account too (ignore failure — profile is gone either way)
    await admin.auth.admin.deleteUser(target.auth_id).catch(() => {})
  }

  revalidatePath('/players')
  revalidatePath('/admin')
  return { success: true }
}
