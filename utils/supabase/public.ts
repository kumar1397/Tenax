// Save as utils/supabase/public.ts
// A Supabase client with NO cookies/session — for public, cacheable reads.
// (Uses the anon key; your public read policies already allow this.)
import { createClient } from '@supabase/supabase-js'

export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}