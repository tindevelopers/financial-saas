import { getCurrentUserWithTenant } from './supabase-server'
import { NextResponse } from 'next/server'

// Helper to get authenticated user with tenant in API routes
export async function requireAuth() {
  const user = await getCurrentUserWithTenant()
  
  if (!user || !user.tenantId) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    }
  }
  
  return {
    error: null,
    user,
  }
}

