'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { submitEventResults } from '@/actions/event'
import { challongeTournamentId } from '@/lib/challonge'

const CHALLONGE_API = 'https://api.challonge.com/v1'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' as const }
  const { data: me } = await supabase.from('Users').select('role').eq('auth_id', user.id).single()
  if (me?.role !== 'admin') return { error: 'Only admins can do this.' as const }
  return { ok: true as const }
}

export type ChallongeParticipant = {
  challongeId: number
  name: string
  username: string | null      // linked Challonge account username, if any
  finalRank: number | null     // placement once the tournament is complete
  seed: number | null
  suggestedUserId: number | null   // auto-matched site account, if we found one
}

export type MatchAccount = {
  id: number
  name: string
  handle: string | null
  challongeUsername: string | null
}

export type ChallongeMatchData = {
  error?: string
  tournamentComplete?: boolean
  participants?: ChallongeParticipant[]
  accounts?: MatchAccount[]
}

// Pull a tournament's participants from Challonge and auto-match each one to a
// site account (exact match on the stored Challonge username). Returns the data
// the admin needs to review and confirm the matches. Admin-only.
export async function getChallongeMatchData(eventId: number): Promise<ChallongeMatchData> {
  const gate = await requireAdmin()
  if ('error' in gate) return { error: gate.error }

  const key = process.env.CHALLONGE_API_KEY
  if (!key) return { error: 'Challonge is not configured yet (missing CHALLONGE_API_KEY).' }

  const admin = createAdminClient()
  const { data: ev } = await admin.from('Events').select('bracket_url').eq('id', eventId).single()
  const tid = challongeTournamentId(ev?.bracket_url)
  if (!tid) return { error: 'This event has no Challonge tournament URL set.' }

  // Fetch participants from the Challonge API.
  let raw: unknown
  try {
    const res = await fetch(
      `${CHALLONGE_API}/tournaments/${encodeURIComponent(tid)}/participants.json?api_key=${encodeURIComponent(key)}`,
      { cache: 'no-store' },
    )
    if (!res.ok) {
      if (res.status === 401) return { error: 'Challonge rejected the API key (401).' }
      if (res.status === 404) return { error: 'Tournament not found on Challonge (404). Check the Bracket URL.' }
      return { error: `Challonge API error (${res.status}).` }
    }
    raw = await res.json()
  } catch (e) {
    return { error: 'Could not reach Challonge: ' + (e instanceof Error ? e.message : 'network error') }
  }

  // v1 wraps each row as { participant: {...} }.
  const rows: any[] = Array.isArray(raw) ? raw.map((r) => (r as any).participant ?? r) : []

  // Load site accounts (small table) for suggestions + the dropdown.
  const { data: users } = await admin.from('Users').select('id, player_name, handle, challonge_username')
  const accounts: MatchAccount[] = (users ?? []).map((u: any) => ({
    id: u.id,
    name: u.player_name || u.handle || 'Player',
    handle: u.handle ?? null,
    challongeUsername: u.challonge_username ?? null,
  }))
  const byUsername = new Map<string, number>()
  for (const a of accounts) if (a.challongeUsername) byUsername.set(a.challongeUsername.toLowerCase(), a.id)

  const participants: ChallongeParticipant[] = rows.map((p) => {
    const username = p.challonge_username ? String(p.challonge_username).toLowerCase() : null
    // Prefer an exact username match; fall back to the display name matching a
    // stored username (covers players added by plain name on Challonge).
    const suggested =
      (username ? byUsername.get(username) : undefined) ??
      (p.name ? byUsername.get(String(p.name).toLowerCase()) : undefined) ??
      null
    return {
      challongeId: Number(p.id),
      name: p.name ?? p.display_name ?? 'Unknown',
      username,
      finalRank: p.final_rank ?? null,
      seed: p.seed ?? null,
      suggestedUserId: suggested,
    }
  })

  const tournamentComplete = participants.some((p) => p.finalRank != null)
  return { participants, accounts, tournamentComplete }
}

// Apply the admin-confirmed matches: add the matched players to the event
// roster and award MMR by their Challonge placement, then finalize. Admin-only.
export async function importChallongeResults(
  eventId: number,
  matches: { userId: number; finalRank: number | null; name: string }[],
) {
  const gate = await requireAdmin()
  if ('error' in gate) return { error: gate.error }

  const admin = createAdminClient()

  const userIds = [...new Set(matches.map((m) => m.userId).filter(Boolean))]
  if (userIds.length === 0) return { error: 'Match at least one player to an account first.' }

  // Ensure matched players are on the event roster so they show as participants.
  const { data: existing } = await admin
    .from('event_participants').select('player_id').eq('event_id', eventId)
  const have = new Set((existing ?? []).map((r: any) => r.player_id))
  const toInsert = userIds.filter((id) => !have.has(id)).map((id) => ({ event_id: eventId, player_id: id }))
  if (toInsert.length) {
    const { error } = await admin.from('event_participants').insert(toInsert)
    if (error) return { error: error.message }
  }

  // MMR per placement — same tiers the manual results page uses.
  const { data: ev } = await admin.from('Events').select('mmr_config').eq('id', eventId).single()
  const c = (ev?.mmr_config ?? {}) as any
  const mmrFor = (rank: number) =>
    rank === 1 ? Number(c.first) || 0
      : rank === 2 ? Number(c.second) || 0
        : rank === 3 ? Number(c.third) || 0
          : rank <= 8 ? Number(c.restAmount) || 0
            : 0

  const awards = matches
    .filter((m) => m.userId && m.finalRank && m.finalRank > 0)
    .map((m) => ({ userId: m.userId, rank: m.finalRank as number, mmr: mmrFor(m.finalRank as number), name: m.name }))

  if (awards.length === 0) {
    return { error: 'No final placements to award — is the tournament complete on Challonge?' }
  }

  // Reuse the existing finalize path: awards MMR, writes the leaderboard, marks
  // the event completed, and guards against double-finalizing.
  const res = await submitEventResults(eventId, awards)
  if (res.error) return { error: res.error }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}
