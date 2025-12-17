import { getCurrentUserWithTenant } from './supabase-server'
import { NextResponse } from 'next/server'

// Helper to get authenticated user with tenant in API routes
// Note: Platform Admins may not have tenantId (they have global access)
export async function requireAuth() {
  const user = await getCurrentUserWithTenant()
  
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    }
  }

  // Platform Admins don't need tenantId
  const isPlatformAdmin = user.roleName === 'Platform Admin' || user.roleName === 'System Admin'
  
  if (!user.tenantId && !isPlatformAdmin) {
    return {
      error: NextResponse.json({ error: 'Unauthorized: No tenant assigned' }, { status: 401 }),
      user: null,
    }
  }
  
  return {
    error: null,
    user: {
      ...user,
      tenantId: user.tenantId, // May be null for Platform Admins
    },
  }
}

