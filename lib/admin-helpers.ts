import { getCurrentUserWithTenant } from './supabase-server'
import { NextResponse } from 'next/server'
import { prisma } from './db'

/**
 * Check if user has admin role (Platform Admin or System Admin)
 * Can be called from client or server
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })

    if (!user || !user.role) {
      return false
    }

    const adminRoles = ['Platform Admin', 'System Admin']
    return adminRoles.includes(user.role.name)
  } catch (error) {
    console.error('Error checking admin role:', error)
    return false
  }
}

/**
 * Client-side check (uses API)
 */
export async function checkAdminAccessClient(): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/check-access', {
      credentials: 'include',
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Require admin authentication - returns error if user is not admin
 */
export async function requireAdmin() {
  const user = await getCurrentUserWithTenant()
  
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
      isAdmin: false,
    }
  }

  const isAdmin = await isAdminUser(user.id)
  
  if (!isAdmin) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      ),
      user: null,
      isAdmin: false,
    }
  }

  return {
    error: null,
    user,
    isAdmin: true,
  }
}

/**
 * Get user's role name
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })

    return user?.role?.name || null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}
