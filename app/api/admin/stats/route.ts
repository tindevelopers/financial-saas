import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/stats - Get admin dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const [totalUsers, totalTenants, totalTransactions, totalUploads] = await Promise.all([
      prisma.user.count(),
      prisma.tenant.count(),
      prisma.transaction.count(),
      prisma.upload.count(),
    ])

    return NextResponse.json({
      totalUsers,
      totalTenants,
      totalTransactions,
      totalUploads,
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to load stats', details: error?.message },
      { status: 500 }
    )
  }
}
