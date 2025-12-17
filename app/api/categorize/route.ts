import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth()
    if (error) return error
    
    const tenantId = user!.tenantId!
    const body = await request.json()
    const { uploadId, customInstructions, batchNumber } = body
    
    if (!uploadId) {
      return NextResponse.json({ error: 'uploadId is required' }, { status: 400 })
    }
    
    // Get tenant settings for custom AI instructions
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })
    
    // Use custom instructions from request, or default
    // Note: Tenant-level instructions would require a settings table or metadata field
    const aiInstructions = customInstructions || 
      'Analyze transaction descriptions carefully. Consider UK business context, common merchant names, and transaction patterns. Use invoice data when available in metadata to improve accuracy.'
    
    // Get transactions for this batch (or all if no batch specified)
    const batchSize = 50
    const currentBatch = batchNumber || 1
    const skip = (currentBatch - 1) * batchSize
    
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        uploadId,
        status: 'pending',
      },
      take: batchSize,
      skip: skip,
      orderBy: { date: 'asc' },
    })
    
    if (transactions.length === 0) {
      return NextResponse.json({ message: 'No transactions to categorize' })
    }
    
    // Get total count for progress tracking
    const totalCount = await prisma.transaction.count({
      where: {
        tenantId,
        uploadId,
        status: 'pending',
      },
    })
    
    console.log(`[CATEGORIZE] Processing batch ${currentBatch}: ${transactions.length} transactions (${totalCount - skip} remaining)`)
    
    // Get categories for this tenant
    const categories = await prisma.category.findMany({
      where: { tenantId, isActive: true },
    })
    
    // Get user corrections for learning
    const recentCorrections = await prisma.userCorrection.findMany({
      where: { tenantId },
      include: {
        correctedCategory: true,
        transaction: true,
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    })
    
    // Build context from past corrections
    const learningContext = recentCorrections.map(c => ({
      description: c.transaction?.description || '',
      category: c.correctedCategory?.name || '',
      reason: c.reason,
    }))
    
    // Prepare categorization request with enhanced context
    const categorizationPrompt = `You are a UK financial transaction categorization expert. Your task is to categorize business transactions accurately into the provided categories.

**Available Categories:**
${categories.map(c => `- ${c.name} (${c.type}): ${c.description || ''}`).join('\n')}

**Custom Instructions:**
${aiInstructions}

**Learning from Past Corrections:**
${learningContext.length > 0 ? learningContext.map(lc => `"${lc.description}" was categorized as "${lc.category}" because: ${lc.reason || 'user correction'}`).join('\n') : 'No past corrections available yet.'}

**Categorization Guidelines:**
1. Analyze each transaction's description, amount, payer/payee, reference, and date
2. Consider UK business context:
   - Common UK merchants (Tesco, Sainsbury's, etc.)
   - UK payment processors (Square, Stripe, PayPal)
   - UK tax categories (VAT, Corporation Tax, etc.)
   - Common business expense patterns
3. If invoice information is available in metadata, use it to improve accuracy
4. Choose the MOST APPROPRIATE category from the available categories
5. Provide a confidence score (0.0 to 1.00):
   - 0.90-1.00: Very confident (clear match, e.g., "Tesco" → "Office Expenses")
   - 0.70-0.89: Confident (likely correct, e.g., "Square" → "Bank Charges")
   - 0.50-0.69: Uncertain (needs review, ambiguous description)
   - Below 0.50: Very uncertain (definitely needs review, no clear pattern)
6. Provide brief reasoning for your choice
7. If confidence < 0.80, the transaction will be flagged for manual review
8. Consider transaction patterns: recurring amounts, merchant names, descriptions

**Transactions to Categorize:**
${transactions.map(t => {
  const metadata = t.metadata as any || {}
  const invoiceInfo = metadata.invoice 
    ? `\n  Invoice Available: ${metadata.invoice.filename || 'Yes'} (use invoice details to improve categorization accuracy)` 
    : ''
  return `ID: ${t.id}
  Date: ${t.date.toISOString().split('T')[0]}
  Description: ${t.description}
  Payer/Payee: ${t.payerPayee || 'N/A'}
  Reference: ${t.reference || 'N/A'}
  Amount: £${t.amount}${invoiceInfo}`
}).join('\n\n')}

**Return JSON format:**
{
  "categorizations": [
    {
      "transactionId": "...",
      "categoryName": "...",
      "confidence": 0.85,
      "reasoning": "..."
    }
  ]
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
    
    // Call LLM API with streaming
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'user', content: categorizationPrompt },
        ],
        response_format: { type: 'json_object' },
        stream: true,
        max_tokens: 3000,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`)
    }
    
    // Stream the response back to client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }
        
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()
        let buffer = ''
        let partialRead = ''
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            partialRead += decoder.decode(value, { stream: true })
            let lines = partialRead.split('\n')
            partialRead = lines.pop() || ''
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                    // Parse final result and update database
                  try {
                    const result = JSON.parse(buffer)
                    const categorizations = result?.categorizations || []
                    
                    let categorizedCount = 0
                    let needsReviewCount = 0
                    
                    // Update transactions with AI categorization
                    for (const cat of categorizations) {
                      const category = categories.find(c => c.name === cat.categoryName)
                      if (category) {
                        const confidence = parseFloat(cat.confidence) || 0
                        await prisma.transaction.update({
                          where: { id: cat.transactionId },
                          data: {
                            categoryId: category.id,
                            confidence: confidence.toString(),
                            aiReasoning: cat.reasoning || cat.reason || 'AI categorization',
                            status: 'categorized',
                            needsReview: confidence < 0.80,
                          },
                        })
                        categorizedCount++
                        if (confidence < 0.80) needsReviewCount++
                      } else {
                        console.warn(`[CATEGORIZE] Category not found: ${cat.categoryName}`)
                      }
                    }
                    
                    // Check if there are more transactions to process
                    const remainingCount = await prisma.transaction.count({
                      where: {
                        tenantId,
                        uploadId,
                        status: 'pending',
                      },
                    })
                    
                    // Send completion message
                    const finalData = JSON.stringify({
                      status: remainingCount > 0 ? 'batch_completed' : 'completed',
                      result: {
                        categorized: categorizedCount,
                        needsReview: needsReviewCount,
                        remaining: remainingCount,
                        batchNumber: batchNumber || 1,
                      },
                    })
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
                  } catch (error: any) {
                    console.error('Error processing final result:', error)
                    const errorData = JSON.stringify({
                      status: 'error',
                      message: error?.message || 'Unknown error',
                    })
                    controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
                  }
                  return
                }
                
                try {
                  const parsed = JSON.parse(data)
                  buffer += parsed?.choices?.[0]?.delta?.content || ''
                  
                  // Send progress update
                  const progressData = JSON.stringify({
                    status: 'processing',
                    message: 'Analyzing transactions...',
                  })
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`))
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error: any) {
          console.error('Stream error:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Categorization error:', error)
    return NextResponse.json(
      { error: 'Failed to categorize transactions', details: error?.message },
      { status: 500 }
    )
  }
}
