import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/check-access - Check if current user has admin access
 */
export async function GET(request: NextRequest) {
  try {
    const { error, user, isAdmin } = await requireAdmin()
    
    if (error) {
      return error
    }

    return NextResponse.json({
      isAdmin: true,
      user: {
        id: user?.id,
        email: user?.email,
        roleName: user?.roleName,
      },
    })
  } catch (error: any) {
    console.error('Admin access check error:', error)
    return NextResponse.json(
      { error: 'Failed to check admin access', details: error?.message },
      { status: 500 }
    )
  }
}
