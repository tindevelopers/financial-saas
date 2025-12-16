"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Only create client in browser
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    const supabase = createSupabaseClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    if (typeof window === 'undefined') return
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.push("/auth/signin")
    router.refresh()
  }

  return {
    user,
    loading,
    signOut,
  }
}

