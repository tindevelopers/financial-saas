import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { parseCSV } from '@/lib/csv-parser'
import { getFileUrl } from '@/lib/s3'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let step = 'initialization'
  
  try {
    console.log('[UPLOAD] ===== Upload request started =====')
    
    // Step 1: Auth check
    step = 'authentication'
    console.log('[UPLOAD] Step 1: Checking authentication...')
    const { error, user } = await requireAuth()
    if (error) {
      console.error('[UPLOAD] ❌ Auth failed:', {
        hasError: !!error,
        hasUser: !!user,
      })
      return error
    }
    console.log('[UPLOAD] ✅ Auth successful:', {
      userId: user?.id,
      tenantId: user?.tenantId,
      email: user?.email,
    })
    
    const tenantId = user!.tenantId!
    
    // Step 2: Parse form data
    step = 'parse_formdata'
    console.log('[UPLOAD] Step 2: Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const cloudStoragePath = formData.get('cloudStoragePath') as string
    
    console.log('[UPLOAD] Form data parsed:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      cloudStoragePath: cloudStoragePath || 'not provided',
    })
    
    if (!file) {
      console.error('[UPLOAD] ❌ No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Step 3: Parse CSV
    step = 'parse_csv'
    console.log('[UPLOAD] Step 3: Parsing CSV file...')
    let parseResult
    try {
      parseResult = await parseCSV(file)
      console.log('[UPLOAD] ✅ CSV parsed:', {
        rowCount: parseResult.rowCount,
        transactionCount: parseResult.transactions.length,
        errorCount: parseResult.errors.length,
      })
    } catch (parseError: any) {
      console.error('[UPLOAD] ❌ CSV parsing failed:', {
        error: parseError.message,
        stack: parseError.stack,
      })
      throw parseError
    }
    
    if (parseResult.errors.length > 0 && parseResult.transactions.length === 0) {
      console.error('[UPLOAD] ❌ CSV parsing failed with no valid transactions')
      return NextResponse.json(
        { error: 'Failed to parse CSV', details: parseResult.errors },
        { status: 400 }
      )
    }
    
    // Step 4: Create upload record
    step = 'create_upload_record'
    console.log('[UPLOAD] Step 4: Creating upload record in database...')
    let upload: Awaited<ReturnType<typeof prisma.upload.create>>
    try {
      upload = await prisma.upload.create({
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
      console.log('[UPLOAD] ✅ Upload record created:', {
        uploadId: upload.id,
        cloudStoragePath: upload.cloudStoragePath,
      })
    } catch (dbError: any) {
      console.error('[UPLOAD] ❌ Failed to create upload record:', {
        error: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
      })
      throw dbError
    }
    
    // Step 5: Create transaction records (bulk insert for performance)
    step = 'create_transactions'
    console.log('[UPLOAD] Step 5: Creating transaction records (bulk insert)...')
    console.log(`[UPLOAD] Preparing ${parseResult.transactions.length} transactions for bulk insert`)
    
    // Prepare data for bulk insert
    const transactionData = parseResult.transactions.map(tx => ({
      tenantId,
      uploadId: upload.id,
      date: tx.date,
      description: tx.description,
      payerPayee: tx.payerPayee || null,
      reference: tx.reference || null,
      paidIn: tx.paidIn !== undefined ? tx.paidIn.toString() : null,
      paidOut: tx.paidOut !== undefined ? tx.paidOut.toString() : null,
      amount: tx.amount.toString(),
      currency: 'GBP',
      originalCategory: tx.originalCategory || null,
      originalSubCategory: tx.originalSubCategory || null,
      transactionType: tx.transactionType || null,
      metadata: tx.metadata || {},
      status: 'pending' as const,
      needsReview: false,
    }))
    
    let createdCount = 0
    try {
      // Use createMany for bulk insert (much faster than individual creates)
      // Note: createMany doesn't return the created records, but we can count them
      const result = await prisma.transaction.createMany({
        data: transactionData,
        skipDuplicates: true, // Skip duplicates if any
      })
      createdCount = result.count
      console.log('[UPLOAD] ✅ Bulk insert completed:', {
        created: createdCount,
        expected: parseResult.transactions.length,
      })
    } catch (bulkError: any) {
      console.error('[UPLOAD] ❌ Bulk insert failed, falling back to individual inserts:', {
        error: bulkError.message,
        code: bulkError.code,
      })
      
      // Fallback: try individual inserts in smaller batches
      const batchSize = 50
      let successCount = 0
      
      for (let i = 0; i < transactionData.length; i += batchSize) {
        const batch = transactionData.slice(i, i + batchSize)
        console.log(`[UPLOAD] Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} transactions)`)
        
        for (const data of batch) {
          try {
            await prisma.transaction.create({ data })
            successCount++
          } catch (txError: any) {
            console.error(`[UPLOAD] ❌ Failed to create transaction:`, {
              error: txError.message,
              description: data.description?.substring(0, 50),
            })
          }
        }
      }
      
      createdCount = successCount
      console.log('[UPLOAD] ✅ Fallback insert completed:', {
        created: createdCount,
        expected: parseResult.transactions.length,
      })
    }
    
    // Step 6: Update upload status
    step = 'update_upload_status'
    console.log('[UPLOAD] Step 6: Updating upload status...')
    try {
      await prisma.upload.update({
        where: { id: upload.id },
        data: {
          status: 'completed',
          processedCount: createdCount,
        },
      })
      console.log('[UPLOAD] ✅ Upload status updated to completed')
    } catch (updateError: any) {
      console.error('[UPLOAD] ❌ Failed to update upload status:', {
        error: updateError.message,
        uploadId: upload.id,
      })
      // Don't throw - we still want to return success
    }
    
    const duration = Date.now() - startTime
    console.log('[UPLOAD] ===== Upload completed successfully =====', {
      uploadId: upload.id,
      transactionsCreated: createdCount,
      errors: parseResult.errors.length,
      duration: `${duration}ms`,
    })
    
    return NextResponse.json({
      uploadId: upload.id,
      transactionsCreated: createdCount,
      errors: parseResult.errors,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('[UPLOAD] ===== Upload failed =====', {
      step,
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      duration: `${duration}ms`,
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to process upload', 
        details: error?.message,
        step,
      },
      { status: 500 }
    )
  }
}
