# Step-by-Step Migration Guide: SaaS Base Structure

This guide walks you through migrating your database from the current structure to the SaaS base structure with UUIDs.

## Prerequisites

- ✅ Prisma schema updated to match SaaS base structure
- ✅ Supabase database connection configured
- ✅ Environment variables set (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, etc.)
- ✅ Backup of your database (CRITICAL!)

## Step 1: Backup Your Database

**⚠️ CRITICAL: Do this first!**

```bash
# Option 1: Using Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/database
# Click "Download backup" or use pg_dump

# Option 2: Using pg_dump locally
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

## Step 2: Apply SaaS Base Migrations to Supabase

The SaaS base migrations create the new structure (roles, workspaces, audit logs, Stripe tables, etc.).

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT/sql
   ```

2. Apply migrations in order:
   ```bash
   # View available migrations
   ls -la supabase/migrations/
   
   # Or use the combined file
   cat supabase/all-migrations-combined.sql
   ```

3. Copy and paste each migration SQL file into the SQL Editor and run them.

### Option B: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or apply migrations manually
for file in supabase/migrations/*.sql; do
  echo "Applying $file..."
  psql $DATABASE_URL < "$file"
done
```

### Option C: Using the Helper Script

```bash
chmod +x scripts/apply-saas-migrations.sh
./scripts/apply-saas-migrations.sh
```

## Step 3: Verify SaaS Base Tables Exist

Run this query in Supabase SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'roles', 
    'workspaces', 
    'workspace_users', 
    'user_tenant_roles',
    'audit_logs',
    'stripe_customers',
    'stripe_subscriptions',
    'stripe_payment_methods'
  )
ORDER BY table_name;
```

You should see all 8 tables listed.

## Step 4: Create Default Roles

The SaaS base requires roles. Create them:

```sql
INSERT INTO roles (id, name, description, coverage, max_seats, current_seats, permissions, gradient)
VALUES
  (gen_random_uuid(), 'Owner', 'Full access to all features', 'Per tenant', 0, 0, ARRAY[]::text[], 'from-blue-500 to-purple-600'),
  (gen_random_uuid(), 'Admin', 'Administrative access', 'Per tenant', 0, 0, ARRAY[]::text[], 'from-green-500 to-teal-600'),
  (gen_random_uuid(), 'Member', 'Standard user access', 'Per tenant', 0, 0, ARRAY[]::text[], 'from-gray-500 to-gray-600'),
  (gen_random_uuid(), 'Viewer', 'Read-only access', 'Per tenant', 0, 0, ARRAY[]::text[], 'from-orange-500 to-red-600')
ON CONFLICT (name) DO NOTHING;
```

## Step 5: Sync Prisma Schema with Database

After applying migrations, sync Prisma:

```bash
# Pull the current database structure
yarn prisma db pull

# Generate Prisma Client
yarn prisma generate
```

## Step 6: Migrate Existing Data (TEXT → UUID)

**⚠️ Only run this if you have existing data with TEXT IDs!**

If your database is empty or already uses UUIDs, skip this step.

```bash
# Run the migration script
tsx scripts/migrate-text-to-uuid.ts
```

This script will:
- Find all records with TEXT (cuid) IDs
- Generate new UUIDs for each record
- Update foreign key relationships
- Preserve all data

## Step 7: Update User Records

Ensure all users have:
- `fullName` field populated
- `roleId` assigned
- `plan` set (default: 'free')
- `status` set (default: 'active')

```sql
-- Update existing users
UPDATE users 
SET 
  full_name = COALESCE(full_name, split_part(email, '@', 1)),
  plan = COALESCE(plan, 'free'),
  status = COALESCE(status, 'active')
WHERE full_name IS NULL OR plan IS NULL OR status IS NULL;

-- Assign default role (Viewer) to users without roles
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'Viewer' LIMIT 1)
WHERE role_id IS NULL;
```

## Step 8: Update Tenant Records

Ensure all tenants have:
- `domain` field populated
- `status` set (default: 'active')
- `plan` set (default: 'free')
- `region` set

```sql
-- Update existing tenants
UPDATE tenants
SET 
  domain = COALESCE(domain, LOWER(REPLACE(name, ' ', '-')) || '.example.com'),
  status = COALESCE(status, 'active'),
  plan = COALESCE(plan, 'free'),
  region = COALESCE(region, 'us-east-1')
WHERE domain IS NULL OR status IS NULL OR plan IS NULL OR region IS NULL;
```

## Step 9: Create Prisma Migration

After all changes, create a Prisma migration:

```bash
# Create migration
yarn prisma migrate dev --name migrate_to_saas_base

# This will create a new migration file that matches your current schema
```

## Step 10: Verify Everything Works

### Test Database Connection

```bash
yarn prisma studio
```

Open Prisma Studio and verify:
- ✅ All tables exist
- ✅ Data is present
- ✅ Relationships work
- ✅ IDs are UUIDs

### Test API Routes

```bash
# Start dev server
yarn dev

# Test signup
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test transactions (requires auth)
curl http://localhost:3000/api/transactions

# Test categories
curl http://localhost:3000/api/categories
```

### Test Frontend

1. Sign up a new user
2. Upload a CSV file
3. View transactions
4. Categorize transactions
5. Export to Google Sheets

## Step 11: Deploy to Vercel

Once everything works locally:

```bash
# Commit changes
git add .
git commit -m "Migrate to SaaS base structure"

# Push to trigger deployment
git push origin main

# Monitor deployment
vercel logs --follow
```

## Troubleshooting

### Issue: "Column does not exist"

**Solution:** Make sure you've applied all SaaS base migrations to Supabase.

### Issue: "Foreign key constraint violation"

**Solution:** The migration script handles this, but if you see errors, check that:
1. All parent records (tenants) are migrated before children (users, categories)
2. Foreign key relationships are updated in the correct order

### Issue: "UUID format invalid"

**Solution:** Your existing IDs might not be in UUID format. Run the migration script to convert them.

### Issue: "Role not found"

**Solution:** Make sure you've created default roles (Step 4).

### Issue: "Tenant domain already exists"

**Solution:** Update the domain generation logic in the migration script or manually set unique domains.

## Rollback Plan

If something goes wrong:

1. **Restore from backup:**
   ```bash
   psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql
   ```

2. **Revert code changes:**
   ```bash
   git revert HEAD
   ```

3. **Redeploy:**
   ```bash
   git push origin main
   ```

## Next Steps

After successful migration:

1. ✅ Set up RLS policies in Supabase
2. ✅ Configure Stripe webhooks
3. ✅ Set up audit logging
4. ✅ Configure workspace features
5. ✅ Test multi-tenancy isolation

## Support

If you encounter issues:
1. Check Supabase logs: https://supabase.com/dashboard/project/YOUR_PROJECT/logs
2. Check Vercel logs: `vercel logs`
3. Review Prisma migration files: `prisma/migrations/`

