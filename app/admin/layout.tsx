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

  // If not authenticated, redirect to signin (server-side redirect)
  if (!user) {
    redirect('/auth/signin')
  }

  // Check if user is admin (Platform Admin or System Admin)
  const isAdmin = user.roleName === 'Platform Admin' || user.roleName === 'System Admin'

  // If not admin, redirect to user dashboard (server-side redirect)
  if (!isAdmin) {
    redirect('/dashboard')
  }

  // User is authenticated and is admin - render client layout
  // All auth checks are done server-side, so no client-side errors
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
