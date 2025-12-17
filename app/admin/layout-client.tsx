"use client"

import { useSidebar } from "@/context/SidebarContext"
import AppHeader from "@/layout/AppHeader"
import AppSidebar from "@/layout/AppSidebar"
import Backdrop from "@/layout/Backdrop"
import { SidebarProvider } from "@/context/SidebarContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { TenantProvider } from "@/core/multi-tenancy/context"
import { WorkspaceProvider } from "@/core/multi-tenancy/workspace-context"
import { WhiteLabelProvider } from "@/context/WhiteLabelContext"

/**
 * Client-side layout component
 * Authentication is handled server-side, so this only handles UI rendering
 */
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar()

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "xl:ml-[290px]"
    : "xl:ml-[90px]"

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

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
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
