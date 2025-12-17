import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithTenant } from '@/lib/supabase-server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserWithTenant()
    
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const tenantId = user.tenantId
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const uploadId = searchParams.get('uploadId')
    
    const skip = (page - 1) * limit
    
    const where: any = { tenantId }
    if (status) where.status = status
    if (uploadId) where.uploadId = uploadId
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          upload: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          date: true,
          description: true,
          payerPayee: true,
          reference: true,
          paidIn: true,
          paidOut: true,
          amount: true,
          currency: true,
          categoryId: true,
          category: true,
          confidence: true,
          aiReasoning: true,
          status: true,
          needsReview: true,
          isReviewed: true,
          reviewedAt: true,
          metadata: true,
          uploadId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.transaction.count({ where }),
    ])
    
    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error?.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUserWithTenant()
    
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const tenantId = user.tenantId
    const body = await request.json()
    const { transactionId, categoryId, isReviewed } = body
    
    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId is required' }, { status: 400 })
    }
    
    // Verify transaction belongs to tenant
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, tenantId },
      include: { category: true },
    })
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    
    // If category is being changed, record as correction
    if (categoryId && categoryId !== transaction.categoryId) {
      await prisma.userCorrection.create({
        data: {
          tenantId,
          transactionId,
          originalCategoryId: transaction.categoryId || undefined,
          correctedCategoryId: categoryId,
          reason: 'Manual correction by user',
          transactionPattern: transaction.description?.substring(0, 50),
        },
      })
    }
    
    // Update transaction
    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        categoryId: categoryId || transaction.categoryId,
        isReviewed: isReviewed !== undefined ? isReviewed : transaction.isReviewed,
        reviewedAt: isReviewed ? new Date() : transaction.reviewedAt,
        status: categoryId ? 'confirmed' : transaction.status,
        needsReview: false,
      },
      include: { category: true },
    })
    
    return NextResponse.json({ transaction: updated })
  } catch (error: any) {
    console.error('Update transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction', details: error?.message },
      { status: 500 }
    )
  }
}
