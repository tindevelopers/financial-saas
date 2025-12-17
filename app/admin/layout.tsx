import { redirect } from 'next/navigation'
import { getCurrentUserWithTenant } from '@/lib/supabase-server'
import AdminLayoutClient from './layout-client'

export const dynamic = 'force-dynamic'

/**
 * Server-side authentication wrapper for admin layout
 * Handles all auth checks on the server before rendering client components
 * This eliminates client-side authentication errors
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth check - no client-side errors possible
  const user = await getCurrentUserWithTenant()

  // Log authentication status for debugging
  console.log('[Admin Layout] Server-side auth check:', {
    hasUser: !!user,
    userId: user?.id,
    roleName: user?.roleName,
    email: user?.email,
  })

  // If not authenticated, redirect to signin (server-side redirect)
  if (!user) {
    console.log('[Admin Layout] No user found, redirecting to signin')
    redirect('/auth/signin')
  }

  // Check if user is admin (Platform Admin or System Admin)
  const isAdmin = user.roleName === 'Platform Admin' || user.roleName === 'System Admin'

  console.log('[Admin Layout] Admin check:', {
    roleName: user.roleName,
    isAdmin,
  })

  // If not admin, redirect to user dashboard (server-side redirect)
  if (!isAdmin) {
    console.log('[Admin Layout] User is not admin, redirecting to dashboard')
    redirect('/dashboard')
  }

  // User is authenticated and is admin - render client layout
  // All auth checks are done server-side, so no client-side errors
  console.log('[Admin Layout] User authenticated as admin, rendering admin panel')
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
