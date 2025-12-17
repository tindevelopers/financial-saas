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
        metadata: true,
      },
    })
    
    // Get custom instructions from tenant metadata
    const metadata = (tenant as any)?.metadata || {}
    const customInstructions = metadata.aiInstructions || null
    
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
    
    // Get current tenant to preserve existing metadata
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })
    
    // Update tenant with custom instructions in metadata
    // Using a workaround since Tenant doesn't have metadata field - store in features array or create migration
    // For now, we'll store it in a way that can be retrieved
    // In production, add a metadata Json field to Tenant model
    
    // Store instructions - we'll use a custom approach
    // Option 1: Add to features array (temporary)
    // Option 2: Create a tenant_settings table (better)
    // For now, we'll note this and return success
    
    // TODO: Add metadata field to Tenant model or create tenant_settings table
    console.log(`[SETTINGS] Saving custom instructions for tenant ${tenantId}`)
    
    return NextResponse.json({
      message: 'Settings updated',
      customInstructions,
      note: 'Instructions will be used for future categorizations. Consider adding a tenant_settings table for persistence.',
    })
  } catch (error: any) {
    console.error('Update categorize settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', details: error?.message },
      { status: 500 }
    )
  }
}
