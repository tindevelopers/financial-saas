import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/tenants - Get all tenants (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            transactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Serialize Date objects to ISO strings to prevent React rendering errors
    const serializedTenants = tenants.map(tenant => ({
      ...tenant,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    }))

    return NextResponse.json({ tenants: serializedTenants })
  } catch (error: any) {
    console.error('Admin tenants error:', error)
    return NextResponse.json(
      { error: 'Failed to load tenants', details: error?.message },
      { status: 500 }
    )
  }
}
