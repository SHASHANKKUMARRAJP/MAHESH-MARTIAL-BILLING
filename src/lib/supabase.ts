import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Karate Academy] Supabase environment variables not set. ' +
    'The app will run in demo mode. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to enable the database.'
  )
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

export const isDemoMode =
  !supabaseUrl ||
  supabaseUrl === 'https://placeholder.supabase.co' ||
  supabaseUrl.includes('YOUR_PROJECT_REF') ||
  !supabaseAnonKey ||
  supabaseAnonKey === 'YOUR_ANON_KEY_HERE'

