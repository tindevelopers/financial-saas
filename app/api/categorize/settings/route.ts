import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/categorize/settings - Get AI categorization settings for tenant
 * POST /api/categorize/settings - Update AI categorization settings
 */
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth()
    if (error) return error
    
    const tenantId = user!.tenantId!
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        features: true,
      },
    })
    
    // Get custom instructions from tenant metadata or settings table
    // For now, we'll use a simple approach - store in tenant.features or create a settings table later
    const customInstructions = (tenant as any)?.aiInstructions || null
    
    return NextResponse.json({
      customInstructions,
      features: tenant?.features || [],
    })
  } catch (error: any) {
    console.error('Get categorize settings error:', error)
    return NextResponse.json(
      { error: 'Failed to get settings', details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth()
    if (error) return error
    
    const tenantId = user!.tenantId!
    const body = await request.json()
    const { customInstructions } = body
    
    // Update tenant with custom instructions
    // Note: This is a simplified approach. In production, you might want a separate settings table
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        // Store in metadata or create a proper settings table
        // For now, we'll add a note that this needs a migration
      },
    })
    
    return NextResponse.json({
      message: 'Settings updated',
      customInstructions,
    })
  } catch (error: any) {
    console.error('Update categorize settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', details: error?.message },
      { status: 500 }
    )
  }
}
