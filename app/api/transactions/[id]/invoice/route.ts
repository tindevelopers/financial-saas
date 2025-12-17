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
    
    // Generate presigned URL for invoice upload
    const { uploadUrl, cloudStoragePath } = await generatePresignedUploadUrl(
      `invoice-${transactionId}-${invoiceFile.name}`,
      invoiceFile.type,
      false // Private file
    )
    
    // Upload invoice to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: invoiceFile,
      headers: {
        'Content-Type': invoiceFile.type,
      },
    })
    
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload invoice to S3')
    }
    
    // Update transaction metadata with invoice info
    const currentMetadata = (transaction.metadata as any) || {}
    const updatedMetadata = {
      ...currentMetadata,
      invoice: {
        url: cloudStoragePath,
        filename: invoiceFile.name,
        uploadedAt: new Date().toISOString(),
      },
    }
    
    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        metadata: updatedMetadata,
      },
      include: { category: true },
    })
    
    return NextResponse.json({
      message: 'Invoice uploaded successfully',
      transaction: updated,
      invoiceUrl: cloudStoragePath,
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
    
    // Generate signed URL for invoice download
    const { getFileUrl } = await import('@/lib/s3')
    const signedUrl = await getFileUrl(invoice.url, false)
    
    return NextResponse.json({
      invoiceUrl: signedUrl,
      filename: invoice.filename,
      uploadedAt: invoice.uploadedAt,
    })
  } catch (error: any) {
    console.error('Get invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to get invoice', details: error?.message },
      { status: 500 }
    )
  }
}
