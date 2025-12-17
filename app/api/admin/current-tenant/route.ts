import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/current-tenant - Get current user's tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth()
    if (error) return error

    // Platform Admins may not have a tenantId
    if (!user!.tenantId) {
      return NextResponse.json(null)
    }

    const tenantId = user!.tenantId
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return NextResponse.json(null)
    }

    // Serialize Date objects to ISO strings to prevent React rendering errors
    return NextResponse.json({
      ...tenant,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Get current tenant error:', error)
    return NextResponse.json(
      { error: 'Failed to get tenant', details: error?.message },
      { status: 500 }
    )
  }
}

