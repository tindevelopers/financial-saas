"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { AdminNav } from "@/components/admin/admin-nav"

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to signin, but preserve admin subdomain
        const signinUrl = new URL('/auth/signin', window.location.origin)
        signinUrl.hostname = window.location.hostname // Keep admin subdomain
        router.push(signinUrl.pathname + signinUrl.search)
        return
      }

      // Check if user is admin
      checkAdminAccess()
    }
  }, [user, loading])

  const checkAdminAccess = async () => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/admin/check-access', {
        credentials: 'include',
      })
      
      if (!response.ok) {
        // Not an admin, redirect to user dashboard
        // Use regular domain, not admin subdomain
        const userUrl = new URL('/dashboard', window.location.origin)
        userUrl.hostname = userUrl.hostname.replace('admin.', '')
        window.location.href = userUrl.toString()
        return
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      const userUrl = new URL('/dashboard', window.location.origin)
      userUrl.hostname = userUrl.hostname.replace('admin.', '')
      window.location.href = userUrl.toString()
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <AdminNav />
        </div>
      </div>
      <div className="flex flex-col">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
