import Papa from 'papaparse'

interface ParsedTransaction {
  date: Date
  description: string
  payerPayee?: string
  reference?: string
  paidIn?: number
  paidOut?: number
  amount: number
  originalCategory?: string
  originalSubCategory?: string
  transactionType?: string
  metadata?: any
}

export interface CSVParseResult {
  transactions: ParsedTransaction[]
  rowCount: number
  errors: string[]
}

// Common UK bank CSV formats
const DATE_FORMATS = [
  /\d{1,2}\/\d{1,2}\/\d{4}/, // DD/MM/YYYY
  /\d{1,2}-\d{1,2}-\d{4}/, // DD-MM-YYYY
  /\d{4}-\d{1,2}-\d{1,2}/, // YYYY-MM-DD
  /\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/, // DD Mon YYYY
]

function parseDate(dateStr: string): Date | null {
  try {
    // Try DD/MM/YYYY format (common in UK)
    if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
      const parts = dateStr.split('/')
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
    }
    
    // Try DD-MM-YYYY format
    if (/\d{1,2}-\d{1,2}-\d{4}/.test(dateStr)) {
      const parts = dateStr.split('-')
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
    }
    
    // Try YYYY-MM-DD format
    if (/\d{4}-\d{1,2}-\d{1,2}/.test(dateStr)) {
      return new Date(dateStr)
    }
    
    // Try DD Mon YYYY format
    if (/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/.test(dateStr)) {
      return new Date(dateStr)
    }
    
    // Fallback to Date.parse
    const parsed = new Date(dateStr)
    return isNaN(parsed.getTime()) ? null : parsed
  } catch (error) {
    return null
  }
}

function parseAmount(amountStr: string | number | undefined): number | undefined {
  if (amountStr === undefined || amountStr === null || amountStr === '') return undefined
  
  // Convert to string if number
  let str = typeof amountStr === 'number' ? amountStr.toString() : amountStr
  
  // Remove currency symbols and commas
  str = str.replace(/[£$€,]/g, '').trim()
  
  // Handle negative amounts in parentheses (100.00) -> -100.00
  if (str.startsWith('(') && str.endsWith(')')) {
    str = '-' + str.slice(1, -1)
  }
  
  const num = parseFloat(str)
  return isNaN(num) ? undefined : num
}

function detectColumns(headers: string[]): {
  dateCol?: number
  descriptionCol?: number
  payerPayeeCol?: number
  referenceCol?: number
  paidInCol?: number
  paidOutCol?: number
  amountCol?: number
  categoryCol?: number
  subCategoryCol?: number
  transactionTypeCol?: number
} {
  const lowerHeaders = headers.map(h => h?.toLowerCase()?.trim() || '')
  
  return {
    dateCol: lowerHeaders.findIndex(h => 
      h.includes('date') || h.includes('transaction date')
    ),
    descriptionCol: lowerHeaders.findIndex(h => 
      h.includes('description') || h.includes('details') || h.includes('narrative')
    ),
    payerPayeeCol: lowerHeaders.findIndex(h => 
      h.includes('payee') || h.includes('payer') || h.includes('name')
    ),
    referenceCol: lowerHeaders.findIndex(h => 
      h.includes('reference') || h.includes('ref')
    ),
    paidInCol: lowerHeaders.findIndex(h => 
      h.includes('paid in') || h.includes('credit') || h.includes('deposit') || h.includes('paid in amount')
    ),
    paidOutCol: lowerHeaders.findIndex(h => 
      h.includes('paid out') || h.includes('debit') || h.includes('withdrawal') || h.includes('paid out amount')
    ),
    amountCol: lowerHeaders.findIndex(h => 
      h === 'amount' || h.includes('transaction amount')
    ),
    categoryCol: lowerHeaders.findIndex(h => 
      h.includes('category') && !h.includes('sub')
    ),
    subCategoryCol: lowerHeaders.findIndex(h => 
      h.includes('sub category') || h.includes('subcategory')
    ),
    transactionTypeCol: lowerHeaders.findIndex(h => 
      h.includes('type') || h.includes('transaction type')
    ),
  }
}

export async function parseCSV(file: File): Promise<CSVParseResult> {
  return new Promise(async (resolve) => {
    const transactions: ParsedTransaction[] = []
    const errors: string[] = []
    
    // In Node.js/server environment, we need to read the file content first
    // File.text() works in both browser and Node.js environments
    let fileContent: string
    try {
      fileContent = await file.text()
    } catch (error: any) {
      errors.push(`Failed to read file: ${error?.message || 'Unknown error'}`)
      resolve({
        transactions: [],
        rowCount: 0,
        errors,
      })
      return
    }
    
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        const cols = detectColumns(headers)
        
        results.data.forEach((row: any, index: number) => {
          try {
            // Get date
            const dateStr = cols.dateCol !== undefined && cols.dateCol >= 0 ? row[headers[cols.dateCol]] : null
            const date = dateStr ? parseDate(dateStr) : null
            
            if (!date) {
              errors.push(`Row ${index + 2}: Invalid or missing date`)
              return
            }
            
            // Get description
            const description = cols.descriptionCol !== undefined && cols.descriptionCol >= 0 
              ? row[headers[cols.descriptionCol]] || 'No description'
              : 'No description'
            
            // Get amounts
            const paidIn = cols.paidInCol !== undefined && cols.paidInCol >= 0 
              ? parseAmount(row[headers[cols.paidInCol]]) 
              : undefined
            
            const paidOut = cols.paidOutCol !== undefined && cols.paidOutCol >= 0 
              ? parseAmount(row[headers[cols.paidOutCol]]) 
              : undefined
            
            // Calculate signed amount
            let amount: number
            if (paidIn !== undefined && paidIn > 0) {
              amount = paidIn
            } else if (paidOut !== undefined && paidOut > 0) {
              amount = -paidOut
            } else if (cols.amountCol !== undefined && cols.amountCol >= 0) {
              amount = parseAmount(row[headers[cols.amountCol]]) || 0
            } else {
              amount = 0
            }
            
            // Get optional fields
            const payerPayee = cols.payerPayeeCol !== undefined && cols.payerPayeeCol >= 0 
              ? row[headers[cols.payerPayeeCol]] 
              : undefined
            
            const reference = cols.referenceCol !== undefined && cols.referenceCol >= 0 
              ? row[headers[cols.referenceCol]] 
              : undefined
            
            const originalCategory = cols.categoryCol !== undefined && cols.categoryCol >= 0 
              ? row[headers[cols.categoryCol]] 
              : undefined
            
            const originalSubCategory = cols.subCategoryCol !== undefined && cols.subCategoryCol >= 0 
              ? row[headers[cols.subCategoryCol]] 
              : undefined
            
            const transactionType = cols.transactionTypeCol !== undefined && cols.transactionTypeCol >= 0 
              ? row[headers[cols.transactionTypeCol]] 
              : undefined
            
            transactions.push({
              date,
              description,
              payerPayee,
              reference,
              paidIn,
              paidOut,
              amount,
              originalCategory,
              originalSubCategory,
              transactionType,
              metadata: row,
            })
          } catch (error: any) {
            errors.push(`Row ${index + 2}: ${error?.message || 'Unknown error'}`)
          }
        })
        
        resolve({
          transactions,
          rowCount: transactions.length,
          errors,
        })
      },
      error: (error: any) => {
        errors.push(`CSV parse error: ${error?.message || 'Unknown error'}`)
        resolve({
          transactions: [],
          rowCount: 0,
          errors,
        })
      },
    })
  })
}
