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
    const { uploadId } = body
    
    if (!uploadId) {
      return NextResponse.json({ error: 'uploadId is required' }, { status: 400 })
    }
    
    // Get transactions for this upload
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        uploadId,
        status: 'pending',
      },
      take: 100, // Process in batches
    })
    
    if (transactions.length === 0) {
      return NextResponse.json({ message: 'No transactions to categorize' })
    }
    
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
    
    // Prepare categorization request
    const categorizationPrompt = `You are a UK financial transaction categorization expert. Your task is to categorize business transactions accurately into the provided categories.

**Available Categories:**
${categories.map(c => `- ${c.name} (${c.type}): ${c.description || ''}`).join('\n')}

**Learning from Past Corrections:**
${learningContext.length > 0 ? learningContext.map(lc => `"${lc.description}" was categorized as "${lc.category}" because: ${lc.reason || 'user correction'}`).join('\n') : 'No past corrections available yet.'}

**Instructions:**
1. Analyze each transaction's description, amount, and other details
2. Choose the MOST APPROPRIATE category from the available categories
3. Provide a confidence score (0.0 to 1.00):
   - 0.90-1.00: Very confident (clear match)
   - 0.70-0.89: Confident (likely correct)
   - 0.50-0.69: Uncertain (needs review)
   - Below 0.50: Very uncertain (definitely needs review)
4. Provide brief reasoning for your choice
5. If confidence < 0.80, the transaction will be flagged for manual review

**Transactions to Categorize:**
${transactions.map(t => `ID: ${t.id}, Date: ${t.date.toISOString().split('T')[0]}, Description: ${t.description}, Amount: £${t.amount}`).join('\n')}

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
                    
                    // Update transactions with AI categorization
                    for (const cat of categorizations) {
                      const category = categories.find(c => c.name === cat.categoryName)
                      if (category) {
                        await prisma.transaction.update({
                          where: { id: cat.transactionId },
                          data: {
                            categoryId: category.id,
                            confidence: cat.confidence?.toString() || '0',
                            aiReasoning: cat.reasoning,
                            status: 'categorized',
                            needsReview: parseFloat(cat.confidence) < 0.80,
                          },
                        })
                      }
                    }
                    
                    // Send completion message
                    const finalData = JSON.stringify({
                      status: 'completed',
                      result: {
                        categorized: categorizations.length,
                        needsReview: categorizations.filter((c: any) => c.confidence < 0.80).length,
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
