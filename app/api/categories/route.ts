import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    const where: any = { tenantId, isActive: true }
    if (type) where.type = type
    
    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })
    
    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const tenantId = (session.user as any).tenantId
    const body = await request.json()
    const { name, type, description } = body
    
    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      )
    }
    
    const category = await prisma.category.create({
      data: {
        tenantId,
        name,
        type,
        description,
        isDefault: false,
      },
    })
    
    return NextResponse.json({ category }, { status: 201 })
  } catch (error: any) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Failed to create category', details: error?.message },
      { status: 500 }
    )
  }
}
