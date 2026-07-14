

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

export async function getEventParticipants(eventId: number) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('event_participants')
        .select('*, Users(*)')   // pulls the full player record for each row
        .eq('event_id', eventId)

    if (error) return { error: error.message, data: [] }
    return { data }
}


// ---- getUsers: join the org so players show the correct org info ----
export async function getUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('Users')
    .select('*, orgs(id, name, tricode, logo, link)')
    .order('mmr', { ascending: false })

  if (error) return { error: error.message, data: [] }
  return { data }
}

export type OrgRow = {
  name: string
  tricode: string
  logo: string
  link: string
  members: number
  totalMmr: number
  avgMmr: number
}

export async function getOrgStandings() {
  const supabase = await createClient()

  // All orgs (the source of truth for name/logo/tricode)
  const { data: orgs, error } = await supabase
    .from('orgs')
    .select('id, name, tricode, logo, link')
  if (error) return { error: error.message, data: [] as OrgRow[] }

  // All members, to count + average MMR per org
  const { data: users } = await supabase
    .from('Users')
    .select('org_id, mmr')

  const agg = new Map<number, { members: number; total: number }>()
  for (const u of users ?? []) {
    if (!u.org_id) continue
    const e = agg.get(u.org_id) ?? { members: 0, total: 0 }
    e.members += 1
    e.total += u.mmr ?? 0
    agg.set(u.org_id, e)
  }

  const rows: OrgRow[] = (orgs ?? [])
    .map((o) => {
      const a = agg.get(o.id) ?? { members: 0, total: 0 }
      return {
        name: o.name,
        tricode: o.tricode ?? '',
        logo: o.logo ?? '',
        link: o.link ?? '',
        members: a.members,
        totalMmr: a.total,
        avgMmr: a.members ? Math.round(a.total / a.members) : 0,
      }
    })
    .filter((o) => o.members > 0) // hide empty orgs

  return { data: rows }
}

export async function registerForEvent(eventId: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to register.' }

  // Now checks org_id (belongs to an org) instead of the old text fields
  const { data: profile } = await supabase
    .from('Users')
    .select('id, player_name, handle, region, org_id')
    .eq('auth_id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found.' }

  const missing: string[] = []
  if (!profile.player_name?.toString().trim()) missing.push('Display Name')
  if (!profile.handle?.toString().trim()) missing.push('Handle')
  if (!profile.region?.toString().trim()) missing.push('Region')
  if (!profile.org_id) missing.push('Organization')

  if (missing.length > 0) return { error: 'INCOMPLETE_PROFILE', missing }

  // Prevent duplicate registration
  const { data: existing } = await supabase
    .from('event_participants')
    .select('id')
    .eq('event_id', eventId)
    .eq('player_id', profile.id)
    .maybeSingle()

  if (existing) return { error: 'You are already registered for this event.' }

  const { error } = await supabase
    .from('event_participants')
    .insert({ event_id: eventId, player_id: profile.id })

  if (error) return { error: error.message }
  return { success: true }
}

export type Org = {
  id: number
  name: string
  tricode: string | null
  logo: string | null
  link: string | null
}

export async function listOrgs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orgs')
    .select('id, name, tricode, logo, link')
    .order('name', { ascending: true })

  if (error) return { error: error.message, data: [] as Org[] }
  return { data: data as Org[] }
}

export async function createOrg(input: {
  name: string
  tricode?: string
  link?: string
  logo?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to create an org.' }

  const name = input.name?.trim()
  if (!name) return { error: 'Org name is required.' }

  // Pick-or-create: if an org with this name already exists (case-insensitive),
  // just return it instead of erroring on the unique constraint.
  const { data: existing } = await supabase
    .from('orgs')
    .select('id, name, tricode, logo, link')
    .ilike('name', name)
    .maybeSingle()

  if (existing) return { data: existing as Org }

  const { data, error } = await supabase
    .from('orgs')
    .insert({
      name,
      tricode: input.tricode?.trim() || null,
      link: input.link?.trim() || null,
      logo: input.logo || null,
      created_by: user.id,
    })
    .select('id, name, tricode, logo, link')
    .single()

  if (error) return { error: error.message }
  return { data: data as Org }
}