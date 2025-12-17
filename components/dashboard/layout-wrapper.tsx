"use client"

import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardNav } from "./nav"

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin")
      return
    }

    // If user is admin and on regular domain, redirect to admin subdomain
    if (user && typeof window !== 'undefined') {
      const checkAdmin = async () => {
        try {
          const response = await fetch("/api/admin/check-access", {
            credentials: "include",
          })
          
          if (response.ok && !window.location.hostname.startsWith('admin.')) {
            // User is admin but on regular domain, redirect to admin subdomain
            const adminUrl = new URL("/admin", window.location.origin)
            adminUrl.hostname = `admin.${adminUrl.hostname.split('.').slice(1).join('.')}`
            window.location.href = adminUrl.toString()
          }
        } catch (error) {
          // Ignore errors, user stays on regular dashboard
        }
      }
      
      checkAdmin()
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <DashboardNav />
        </div>
      </div>
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
