"use client"

import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (for use in client components)
export function createSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('createSupabaseClient can only be used in client components')
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

