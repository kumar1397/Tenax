'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { generateSingleElim, rebuildRounds, type Bracket, type BracketPlayer } from '@/lib/bracket'

// Returns an error message if the caller isn't an admin, else null.
async function adminError(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'You must be signed in.'
  const { data: me } = await supabase.from('Users').select('role').eq('auth_id', user.id).single()
  if (me?.role !== 'admin') return 'Only admins can manage the bracket.'
  return null
}

export async function generateBracket(eventId: number, seededBy: 'mmr' | 'random') {
  const err = await adminError()
  if (err) return { error: err }

  const admin = createAdminClient()

  // Snapshot the registered players (with MMR for seeding).
  const { data: parts } = await admin
    .from('event_participants')
    .select('player_id, Users(id, player_name, player_image, mmr)')
    .eq('event_id', eventId)

  const players: BracketPlayer[] = (parts ?? [])
    .map((r: any) => r.Users)
    .filter(Boolean)
    .map((u: any) => ({
      playerId: u.id,
      name: u.player_name || 'Player',
      avatar: u.player_image || '',
      mmr: u.mmr ?? 0,
    }))

  if (players.length < 2) return { error: 'Need at least 2 registered players to generate a bracket.' }

  const bracket = generateSingleElim(players, seededBy)
  const { error } = await admin.from('Events').update({ bracket }).eq('id', eventId)
  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function setBracketWinner(eventId: number, round: number, matchIndex: number, winnerIdx: 0 | 1) {
  const err = await adminError()
  if (err) return { error: err }

  const admin = createAdminClient()
  const { data: ev } = await admin.from('Events').select('bracket').eq('id', eventId).single()
  const bracket = ev?.bracket as Bracket | null
  if (!bracket?.rounds) return { error: 'No bracket yet.' }

  const match = bracket.rounds[round]?.[matchIndex]
  if (!match) return { error: 'Match not found.' }
  if (!match.a || !match.b) return { error: 'Both players must be set before picking a winner.' }

  match.winner = winnerIdx
  rebuildRounds(bracket.rounds)

  const { error } = await admin.from('Events').update({ bracket }).eq('id', eventId)
  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function clearBracket(eventId: number) {
  const err = await adminError()
  if (err) return { error: err }

  const admin = createAdminClient()
  const { error } = await admin.from('Events').update({ bracket: null }).eq('id', eventId)
  if (error) return { error: error.message }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}
