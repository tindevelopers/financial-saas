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
        tenantSettings: {
          select: {
            aiCustomInstructions: true,
          },
        },
      },
    })
    
    const customInstructions = tenant?.tenantSettings?.aiCustomInstructions || null
    
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
    
    // Upsert tenant settings (create if doesn't exist, update if exists)
    const tenantSettings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        aiCustomInstructions: customInstructions || null,
      },
      update: {
        aiCustomInstructions: customInstructions || null,
        updatedAt: new Date(),
      },
    })
    
    console.log(`[SETTINGS] Saved custom instructions for tenant ${tenantId}`)
    
    return NextResponse.json({
      message: 'Settings updated successfully',
      customInstructions: tenantSettings.aiCustomInstructions,
    })
  } catch (error: any) {
    console.error('Update categorize settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', details: error?.message },
      { status: 500 }
    )
  }
}
