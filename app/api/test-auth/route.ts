import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUser, getCurrentUserWithTenant } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * Test endpoint to debug authentication issues
 * GET /api/test-auth - Returns detailed auth information
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    // Get Supabase client
    const supabase = await createServerSupabaseClient()
    
    // Try to get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    // Try to get user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    // Try our auth helpers
    const currentUser = await getCurrentUser()
    const userWithTenant = await getCurrentUserWithTenant()
    
    return NextResponse.json({
      success: true,
      debug: {
        cookies: {
          count: allCookies.length,
          names: allCookies.map(c => c.name),
          supabaseCookies: allCookies
            .filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
            .map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length || 0 })),
        },
        session: {
          exists: !!sessionData.session,
          error: sessionError?.message || null,
          userId: sessionData.session?.user?.id || null,
        },
        user: {
          exists: !!userData.user,
          error: userError?.message || null,
          userId: userData.user?.id || null,
          email: userData.user?.email || null,
        },
        currentUser: {
          exists: !!currentUser,
          userId: currentUser?.id || null,
          email: currentUser?.email || null,
        },
        userWithTenant: {
          exists: !!userWithTenant,
          userId: userWithTenant?.id || null,
          tenantId: userWithTenant?.tenantId || null,
          email: userWithTenant?.email || null,
        },
        authStatus: userWithTenant ? 'authenticated' : 'not authenticated',
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
