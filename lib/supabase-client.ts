"use client"

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance to prevent multiple GoTrueClient instances
let supabaseClient: SupabaseClient | null = null

// Client-side Supabase client (for use in client components)
// Uses @supabase/ssr to ensure cookies are synced with server
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

  // Use createBrowserClient from @supabase/ssr to ensure cookies are synced
  // This ensures the session is available to both client and server
  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return supabaseClient
}

