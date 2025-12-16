"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
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

