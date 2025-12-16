import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth()
    if (error) return error
    
    const tenantId = user!.tenantId!
    const body = await request.json()
    const { uploadId, spreadsheetId } = body
    
    // Get Google Sheets connection
    const connection = await prisma.googleSheetsConnection.findUnique({
      where: { tenantId },
    })
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Google Sheets not connected. Please connect your Google account first.' },
        { status: 400 }
      )
    }
    
    // Check if token is expired and refresh if needed
    const now = new Date()
    if (connection.expiresAt && new Date(connection.expiresAt) < now) {
      // Token expired, need to refresh
      if (!connection.refreshToken) {
        return NextResponse.json(
          { error: 'Google Sheets token expired. Please reconnect your account.' },
          { status: 401 }
        )
      }
      
      // TODO: Implement token refresh logic
      return NextResponse.json(
        { error: 'Token refresh not yet implemented. Please reconnect your account.' },
        { status: 401 }
      )
    }
    
    // Get transactions to export
    const where: any = { tenantId }
    if (uploadId) where.uploadId = uploadId
    
    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'asc' },
    })
    
    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions to export' },
        { status: 400 }
      )
    }
    
    // Setup OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    
    oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken || undefined,
    })
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })
    
    // Prepare data for export
    const headers = [
      'Date',
      'Description',
      'Payee/Payer',
      'Reference',
      'Paid In (£)',
      'Paid Out (£)',
      'Amount (£)',
      'Category',
      'Confidence',
      'Status',
    ]
    
    const rows = transactions.map(t => [
      t.date.toISOString().split('T')[0],
      t.description,
      t.payerPayee || '',
      t.reference || '',
      t.paidIn ? parseFloat(t.paidIn.toString()).toFixed(2) : '',
      t.paidOut ? parseFloat(t.paidOut.toString()).toFixed(2) : '',
      parseFloat(t.amount.toString()).toFixed(2),
      t.category?.name || 'Uncategorized',
      t.confidence ? parseFloat(t.confidence.toString()).toFixed(2) : '',
      t.status,
    ])
    
    const data = [headers, ...rows]
    
    let finalSpreadsheetId = spreadsheetId
    let spreadsheetUrl = ''
    
    if (!finalSpreadsheetId) {
      // Create new spreadsheet
      const createResponse = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `Transactions Export - ${new Date().toISOString().split('T')[0]}`,
          },
          sheets: [
            {
              properties: {
                title: 'Transactions',
              },
            },
          ],
        },
      })
      
      finalSpreadsheetId = createResponse.data.spreadsheetId!
      spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${finalSpreadsheetId}`
    } else {
      spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${finalSpreadsheetId}`
    }
    
    // Write data to spreadsheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: finalSpreadsheetId,
      range: 'Transactions!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: data,
      },
    })
    
    // Format spreadsheet (freeze header, bold, etc.)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: finalSpreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: 0,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true,
                  },
                },
              },
              fields: 'userEnteredFormat.textFormat.bold',
            },
          },
        ],
      },
    })
    
    return NextResponse.json({
      spreadsheetId: finalSpreadsheetId,
      spreadsheetUrl,
      exportedCount: transactions.length,
    })
  } catch (error: any) {
    console.error('Google Sheets export error:', error)
    return NextResponse.json(
      { error: 'Failed to export to Google Sheets', details: error?.message },
      { status: 500 }
    )
  }
}
