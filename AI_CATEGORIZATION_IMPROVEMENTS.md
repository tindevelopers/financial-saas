# AI Categorization Improvements

## Issues Identified

1. **Batch Processing Limit**: Only 100 transactions processed at a time
2. **No Custom Instructions**: AI can't accept user-specific categorization rules
3. **No Invoice Support**: Can't use invoice data to improve accuracy
4. **Incomplete CSV Export**: Missing categorization details
5. **Silent Failures**: Errors in categorization might not be visible

## Improvements Made

### 1. Process All Transactions ✅
- Changed from fixed 100 limit to batch processing
- Processes all transactions in batches of 50
- Tracks remaining transactions and continues until all are processed

### 2. Custom AI Instructions ✅
- Added support for custom instructions per tenant
- Instructions can be set via `/api/categorize/settings`
- Instructions are included in the AI prompt
- Example: "Always categorize Square transactions as Bank Charges"

### 3. Enhanced AI Prompt ✅
- Added UK business context awareness
- Includes payer/payee and reference fields
- Better confidence scoring guidance
- Invoice metadata support (when available)

### 4. Improved CSV Export ✅
- Added columns: Reference, Confidence, AI Reasoning, Needs Review, Reviewed
- Full categorization details included
- Can be imported back into spreadsheet tools

### 5. Better Error Handling ✅
- Logging for categorization failures
- Tracks batch progress
- Reports remaining transactions

## How to Use

### Set Custom AI Instructions

```bash
POST /api/categorize/settings
{
  "customInstructions": "Always categorize Square transactions as Bank Charges. Categorize Tesco as Office Expenses."
}
```

### Categorize with Custom Instructions

```bash
POST /api/categorize
{
  "uploadId": "...",
  "customInstructions": "Your custom rules here"
}
```

### Export Full Spreadsheet

1. Go to Transactions page
2. Click "Export CSV"
3. Open in Excel/Google Sheets
4. All categorization details included:
   - Category
   - Confidence score
   - AI reasoning
   - Review status

## Invoice Support (Future Enhancement)

To add invoice support:

1. **Add invoice field to Transaction schema**:
   ```prisma
   invoiceUrl String? @map("invoice_url")
   invoiceData Json? @map("invoice_data") @db.JsonB
   ```

2. **Upload invoice when categorizing**:
   - Add file upload to transaction edit page
   - Store invoice URL or extract text data
   - Include in metadata when calling categorize API

3. **AI will use invoice data**:
   - Invoice line items
   - Vendor information
   - Invoice categories
   - Amount breakdowns

## User Verification & Changes

Users can verify and change categories:

1. **In Transactions Page**:
   - Click dropdown on any transaction
   - Select correct category
   - Changes are saved automatically
   - Corrections are recorded for AI learning

2. **Bulk Edit** (Future):
   - Select multiple transactions
   - Change category for all selected
   - Add reason for correction

3. **Learning System**:
   - All corrections are stored in `user_corrections` table
   - AI uses past corrections to improve future categorizations
   - Pattern matching for similar transactions

## Next Steps

1. **Add Invoice Upload UI**: Allow users to attach invoices to transactions
2. **Bulk Edit**: Enable selecting multiple transactions and changing category
3. **AI Instruction UI**: Settings page to configure custom instructions
4. **Categorization Rules**: Visual rule builder for common patterns
5. **Re-categorize**: Button to re-run AI categorization with updated instructions
