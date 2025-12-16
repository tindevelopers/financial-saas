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
    let upload
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
    
    // Step 5: Create transaction records
    step = 'create_transactions'
    console.log('[UPLOAD] Step 5: Creating transaction records...')
    const createdTransactions = []
    let transactionIndex = 0
    
    for (const tx of parseResult.transactions) {
      try {
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
        transactionIndex++
        
        // Log progress every 10 transactions
        if (transactionIndex % 10 === 0) {
          console.log(`[UPLOAD] Progress: ${transactionIndex}/${parseResult.transactions.length} transactions created`)
        }
      } catch (txError: any) {
        console.error(`[UPLOAD] ❌ Failed to create transaction ${transactionIndex}:`, {
          error: txError.message,
          code: txError.code,
          transactionData: {
            date: tx.date,
            description: tx.description?.substring(0, 50),
            amount: tx.amount,
          },
        })
        // Continue with other transactions even if one fails
      }
    }
    
    console.log('[UPLOAD] ✅ Transactions created:', {
      total: createdTransactions.length,
      expected: parseResult.transactions.length,
      failed: parseResult.transactions.length - createdTransactions.length,
    })
    
    // Step 6: Update upload status
    step = 'update_upload_status'
    console.log('[UPLOAD] Step 6: Updating upload status...')
    try {
      await prisma.upload.update({
        where: { id: upload.id },
        data: {
          status: 'completed',
          processedCount: createdTransactions.length,
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
      transactionsCreated: createdTransactions.length,
      errors: parseResult.errors.length,
      duration: `${duration}ms`,
    })
    
    return NextResponse.json({
      uploadId: upload.id,
      transactionsCreated: createdTransactions.length,
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
