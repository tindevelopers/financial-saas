"use client"

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton instance to prevent multiple GoTrueClient instances
let supabaseClient: SupabaseClient | null = null

// Client-side Supabase client (for use in client components)
export function createSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('createSupabaseClient can only be used in client components')
  }
  
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Create and cache the client
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}

