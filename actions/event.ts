

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
    rules: string          // NEW
    bracketUrl: string     // NEW
    streamUrl: string      // NEW
}

export async function createEvent(form: EventForm) {
    const supabase = await createClient()

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
        event_rule: form.rules || null,          // NEW
        cover_image: form.cover || null,
        bracket_url: form.bracketUrl || null,     // NEW
        stream_url: form.streamUrl || null,       // NEW
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