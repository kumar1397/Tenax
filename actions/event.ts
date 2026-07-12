

'use server'

import { createClient } from '@/utils/supabase/server'

export type EventForm = {
    title: string
    game: string
    region: string
    format: string
    prize: string
    entry: string
    startsAt: string
    capacity: string
    description: string
    cover: string
    rules: string          
    bracketUrl: string     
    streamUrl: string     
}

export async function createEvent(form: EventForm) {
  const supabase = await createClient()

  // Auth guard — must be signed in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to create an event.' }

  const isFree = !form.entry || form.entry.toLowerCase() === 'free'

  const { error } = await supabase.from('Events').insert({
    event_name: form.title,
    game_name: form.game,
    event_region: form.region,
    event_format: form.format,
    event_date: form.startsAt ? form.startsAt.split('T')[0] : null,
    event_time: form.startsAt?.includes('T') ? form.startsAt.split('T')[1] : null,
    is_paid: !isFree,
    event_fee: isFree ? 0 : Number(form.entry) || 0,
    event_status: 'upcoming',
    total_player: Number(form.capacity) || null,
    no_of_player: 0,
    prize_pool: form.prize ? Number(form.prize) : null,
    event_description: form.description || null,
    event_rule: form.rules || null,
    cover_image: form.cover || null,
    bracket_url: form.bracketUrl || null,
    stream_url: form.streamUrl || null,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getEvents() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('Events')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return { error: error.message, data: [] }
    return { data }
}


// READ one event by id
export async function getEvent(id: number) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('Events')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return { error: error.message, data: null }
    return { data }
}

// READ participants of an event (joins the Users table via the junction)
export async function getEventParticipants(eventId: number) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('event_participants')
        .select('*, Users(*)')   // pulls the full player record for each row
        .eq('event_id', eventId)

    if (error) return { error: error.message, data: [] }
    return { data }
}


export async function getUsers() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('Users')
        .select('*')
        .order('mmr', { ascending: false })

    if (error) return { error: error.message, data: [] }
    return { data }
}


export type OrgRow = {
  name: string;
  tricode: string;
  logo: string;
  link: string;
  members: number;
  totalMmr: number;
  avgMmr: number;
};

export async function getOrgStandings() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('Users')
    .select('org_name, org_tricode, org_logo, org_link, mmr')

  if (error) return { error: error.message, data: [] as OrgRow[] }

  const orgs = new Map<string, OrgRow>()

  for (const u of data ?? []) {
    if (!u.org_name) continue
    const o = orgs.get(u.org_name) ?? {
      name: u.org_name,
      tricode: u.org_tricode ?? '',
      logo: u.org_logo ?? '',
      link: u.org_link ?? '',
      members: 0,
      totalMmr: 0,
      avgMmr: 0,
    }
    o.members += 1
    o.totalMmr += u.mmr ?? 0
    orgs.set(u.org_name, o)
  }

  const result = Array.from(orgs.values()).map((o) => ({
    ...o,
    avgMmr: o.members ? Math.round(o.totalMmr / o.members) : 0,
  }))

  return { data: result }
}

const REQUIRED = ['player_name', 'handle', 'region', 'org_name', 'org_tricode', 'org_link'] as const

export async function registerForEvent(eventId: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to register.' }

  // Look up the player's profile row
  const { data: profile } = await supabase
    .from('Users')
    .select('id, player_name, handle, region, org_name, org_tricode, org_link')
    .eq('auth_id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found.' }

  // Profile-completion gate
  const missing = REQUIRED.filter((f) => !profile[f as keyof typeof profile]?.toString().trim())
  if (missing.length > 0) {
    return { error: 'INCOMPLETE_PROFILE', missing }
  }

  // Prevent duplicate registration
  const { data: existing } = await supabase
    .from('event_participants')
    .select('id')
    .eq('event_id', eventId)
    .eq('player_id', profile.id)
    .maybeSingle()

  if (existing) return { error: 'You are already registered for this event.' }

  // Register
  const { error } = await supabase
    .from('event_participants')
    .insert({ event_id: eventId, player_id: profile.id })

  if (error) return { error: error.message }
  return { success: true }
}