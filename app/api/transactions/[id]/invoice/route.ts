import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { generatePresignedUploadUrl } from '@/lib/s3'

export const dynamic = 'force-dynamic'

/**
 * POST /api/transactions/[id]/invoice - Upload invoice for a transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user } = await requireAuth()
    if (error) return error
    
    const tenantId = user!.tenantId!
    const transactionId = params.id
    
    // Verify transaction belongs to tenant
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, tenantId },
    })
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    
    const formData = await request.formData()
    const invoiceFile = formData.get('invoice') as File
    
    if (!invoiceFile) {
      return NextResponse.json({ error: 'No invoice file provided' }, { status: 400 })
    }
    
    // For now, store invoice metadata directly (S3 upload can be added later)
    // In production, upload to S3 and store the URL
    const invoiceData = {
      filename: invoiceFile.name,
      size: invoiceFile.size,
      type: invoiceFile.type,
      uploadedAt: new Date().toISOString(),
      // Note: For full implementation, upload file to S3 and store URL
      // For now, we'll store metadata and note that file needs to be uploaded
      note: 'File upload to S3 pending - metadata stored',
    }
    
    // Update transaction metadata with invoice info
    const currentMetadata = (transaction.metadata as any) || {}
    const updatedMetadata = {
      ...currentMetadata,
      invoice: invoiceData,
    }
    
    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        metadata: updatedMetadata,
      },
      include: { category: true },
    })
    
    return NextResponse.json({
      message: 'Invoice metadata saved successfully',
      transaction: updated,
      invoice: invoiceData,
    })
  } catch (error: any) {
    console.error('Upload invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to upload invoice', details: error?.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/transactions/[id]/invoice - Get invoice URL for a transaction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user } = await requireAuth()
    if (error) return error
    
    const tenantId = user!.tenantId!
    const transactionId = params.id
    
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, tenantId },
    })
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    
    const metadata = transaction.metadata as any
    const invoice = metadata?.invoice
    
    if (!invoice) {
      return NextResponse.json({ error: 'No invoice found' }, { status: 404 })
    }
    
    // If invoice has URL, generate signed URL for download
    // Otherwise, return metadata
    let invoiceUrl = null
    if (invoice.url) {
      const { getFileUrl } = await import('@/lib/s3')
      invoiceUrl = await getFileUrl(invoice.url, false)
    }
    
    return NextResponse.json({
      invoiceUrl,
      filename: invoice.filename,
      uploadedAt: invoice.uploadedAt,
      metadata: invoice,
    })
  } catch (error: any) {
    console.error('Get invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to get invoice', details: error?.message },
      { status: 500 }
    )
  }
}
