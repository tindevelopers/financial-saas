"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useSidebar } from "@/context/SidebarContext"
import AppHeader from "@/layout/AppHeader"
import AppSidebar from "@/layout/AppSidebar"
import Backdrop from "@/layout/Backdrop"
import { usePathname } from "next/navigation"
import { SidebarProvider } from "@/context/SidebarContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { TenantProvider } from "@/core/multi-tenancy/context"
import { WorkspaceProvider } from "@/core/multi-tenancy/workspace-context"
import { WhiteLabelProvider } from "@/context/WhiteLabelContext"

export const dynamic = 'force-dynamic'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSupabaseAuth()
  const router = useRouter()
  const { isExpanded, isHovered, isMobileOpen } = useSidebar()
  const pathname = usePathname()

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
        // Remove admin subdomain: admin.fincat.tinconnect.com -> fincat.tinconnect.com
        const userUrl = new URL('/dashboard', window.location.origin)
        userUrl.hostname = userUrl.hostname.replace(/^admin\./, '')
        window.location.href = userUrl.toString()
        return
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      const userUrl = new URL('/dashboard', window.location.origin)
      userUrl.hostname = userUrl.hostname.replace(/^admin\./, '')
      window.location.href = userUrl.toString()
    }
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "xl:ml-[290px]"
    : "xl:ml-[90px]"

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
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ThemeProvider>
        <TenantProvider>
          <WorkspaceProvider>
            <WhiteLabelProvider>
              <AdminLayoutContent>{children}</AdminLayoutContent>
            </WhiteLabelProvider>
          </WorkspaceProvider>
        </TenantProvider>
      </ThemeProvider>
    </SidebarProvider>
  )
}
