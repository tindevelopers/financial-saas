# Tenant Settings Migration Guide

## Overview

A new `tenant_settings` table has been created to persist custom AI instructions per tenant. This allows each tenant to have their own AI categorization preferences that persist across sessions.

## Migration Steps

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `prisma/migrations/20251217000000_create_tenant_settings/migration.sql`
4. Paste and run the SQL in the SQL Editor
5. Verify the table was created: Check **Table Editor** → `tenant_settings`

### Option 2: Apply via Prisma Migrate (Local)

If you have direct database access:

```bash
npx prisma migrate deploy
```

**Note:** This requires `DIRECT_URL` in your `.env` file pointing to the direct database connection (port 5432, not 6543).

## What Was Created

### Table: `tenant_settings`

- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Unique, Foreign Key → tenants.id)
- `ai_custom_instructions` (TEXT, nullable) - Stores custom AI instructions
- `metadata` (JSONB, nullable) - For future settings
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Relationships

- One-to-one relationship with `tenants` table
- Cascade delete (if tenant is deleted, settings are deleted)

## API Changes

### GET `/api/categorize/settings`
- Now retrieves custom instructions from `tenant_settings` table
- Returns `null` if no settings exist

### POST `/api/categorize/settings`
- Creates or updates tenant settings using `upsert`
- Persists `aiCustomInstructions` to database

### POST `/api/categorize`
- Uses tenant settings if `customInstructions` not provided in request
- Falls back to default instructions if no tenant settings exist

## Usage

### Setting Custom Instructions

```javascript
// Save custom instructions for tenant
const response = await fetch('/api/categorize/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customInstructions: 'Always categorize Square transactions as Bank Charges. Tesco = Office Expenses.'
  })
})
```

### Getting Custom Instructions

```javascript
// Retrieve custom instructions
const response = await fetch('/api/categorize/settings')
const { customInstructions } = await response.json()
```

### Using in Categorization

Custom instructions are automatically used when categorizing transactions:

1. If `customInstructions` provided in request → use those
2. Else if tenant has saved settings → use tenant settings
3. Else → use default instructions

## Benefits

✅ **Persistent**: Settings survive across sessions  
✅ **Per-tenant**: Each tenant can have their own instructions  
✅ **Flexible**: Can override per-request if needed  
✅ **Extensible**: `metadata` field allows future settings  

## Next Steps

After applying the migration:

1. ✅ Migration applied to database
2. ✅ Prisma Client regenerated
3. ✅ API routes updated
4. ✅ Frontend can now save/load custom instructions

The system is ready to use! Tenants can now save their custom AI instructions and they'll be used automatically for all future categorizations.
