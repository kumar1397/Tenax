import { createClient } from '@/utils/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('Events').select('*')

  if (error) {
    return <pre style={{ color: 'red' }}>Error: {error.message}</pre>
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>
}