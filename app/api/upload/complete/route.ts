import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { parseCSV } from '@/lib/csv-parser'
import { getFileUrl } from '@/lib/s3'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth()
    if (error) {
      console.error('Upload auth error: Unauthorized', {
        hasError: !!error,
        hasUser: !!user,
        cookies: request.cookies.getAll().map(c => c.name),
      })
      return error
    }
    
    const tenantId = user!.tenantId!
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const cloudStoragePath = formData.get('cloudStoragePath') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Parse CSV
    const parseResult = await parseCSV(file)
    
    if (parseResult.errors.length > 0 && parseResult.transactions.length === 0) {
      return NextResponse.json(
        { error: 'Failed to parse CSV', details: parseResult.errors },
        { status: 400 }
      )
    }
    
    // Create upload record
    const upload = await prisma.upload.create({
      data: {
        tenantId,
        filename: file.name,
        originalFilename: file.name,
        cloudStoragePath: cloudStoragePath || `uploads/${Date.now()}-${file.name}`,
        fileSize: file.size,
        rowCount: parseResult.rowCount,
        processedCount: 0,
        status: 'processing',
      },
    })
    
    // Create transaction records
    const createdTransactions = []
    for (const tx of parseResult.transactions) {
      const transaction = await prisma.transaction.create({
        data: {
          tenantId,
          uploadId: upload.id,
          date: tx.date,
          description: tx.description,
          payerPayee: tx.payerPayee,
          reference: tx.reference,
          paidIn: tx.paidIn !== undefined ? tx.paidIn.toString() : null,
          paidOut: tx.paidOut !== undefined ? tx.paidOut.toString() : null,
          amount: tx.amount.toString(),
          currency: 'GBP',
          originalCategory: tx.originalCategory,
          originalSubCategory: tx.originalSubCategory,
          transactionType: tx.transactionType,
          metadata: tx.metadata || {},
          status: 'pending',
          needsReview: false,
        },
      })
      createdTransactions.push(transaction)
    }
    
    // Update upload status
    await prisma.upload.update({
      where: { id: upload.id },
      data: {
        status: 'completed',
        processedCount: createdTransactions.length,
      },
    })
    
    return NextResponse.json({
      uploadId: upload.id,
      transactionsCreated: createdTransactions.length,
      errors: parseResult.errors,
    })
  } catch (error: any) {
    console.error('Upload completion error:', error)
    return NextResponse.json(
      { error: 'Failed to process upload', details: error?.message },
      { status: 500 }
    )
  }
}
