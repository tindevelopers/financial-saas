import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users - Get all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const users = await prisma.user.findMany({
      include: {
        role: true,
        tenant: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Serialize Date objects to ISO strings to prevent React rendering errors
    const serializedUsers = users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }))

    return NextResponse.json({ users: serializedUsers })
  } catch (error: any) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Failed to load users', details: error?.message },
      { status: 500 }
    )
  }
}
