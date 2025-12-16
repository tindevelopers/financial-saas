# Migration Plan: Aligning with SaaS Base Structure

## Overview
We're updating the codebase to match the `@tindeveloper/tinadmin-saas-base` structure, which uses UUIDs and includes roles, workspaces, audit logs, Stripe, and CRM features.

## Step 1: Apply SaaS Base Migrations to Supabase

### Method: Supabase Dashboard SQL Editor

1. Go to: https://supabase.com/dashboard/project/aejlgccswnauirqyzrzl/sql

2. Apply migrations in this order:
   ```bash
   # Start with the base structure
   supabase/migrations/20251204211105_create_users_tenants_roles.sql
   
   # Then RLS policies
   supabase/migrations/20251204220000_tenant_isolation_rls.sql
   supabase/migrations/20251204220001_fix_rls_auth.sql
   # ... (all other RLS migrations)
   
   # Then additional features
   supabase/migrations/20251204220014_create_audit_logs.sql
   supabase/migrations/20251205000000_workspaces_schema.sql
   supabase/migrations/20251207000000_create_stripe_tables.sql
   supabase/migrations/20251208000000_create_crm_tables.sql
   ```

3. **Important**: These migrations will create new tables with UUID IDs. Your existing data will need to be migrated.

## Step 2: Data Migration (TEXT → UUID)

After applying SaaS base migrations, you'll need to:

1. **Backup existing data**
2. **Migrate existing records**:
   - Convert TEXT IDs to UUIDs
   - Update foreign key references
   - Map existing user data to new structure

## Step 3: Update Code

### Schema Changes:
- ✅ Prisma schema updated to use UUIDs
- ✅ Added Role, Workspace, AuditLog, Stripe models
- ⏳ Update API routes to use new field names (`fullName` instead of `name`)
- ⏳ Update components to use new structure

### Code Updates Needed:

1. **API Routes**:
   - Update to use `fullName` instead of `name`
   - Handle UUID types correctly
   - Add role-based access control

2. **Components**:
   - Update user display to use `fullName`
   - Add role-based UI elements

3. **Database Queries**:
   - All ID comparisons now use UUIDs
   - Update any hardcoded ID formats

## Step 4: Testing

1. Test user signup/signin
2. Test tenant isolation
3. Test RLS policies
4. Test financial transaction features
5. Test new SaaS features (roles, workspaces, etc.)

## Current Status

- ✅ Prisma schema updated to match SaaS base
- ✅ Supabase client utilities created
- ✅ Auth helpers updated
- ⏳ Need to apply migrations to Supabase
- ⏳ Need to update API routes for new field names
- ⏳ Need to migrate existing data

## Next Steps

1. **Apply SaaS base migrations** to Supabase (via SQL Editor)
2. **Create data migration script** to convert existing data
3. **Update all API routes** to use new schema
4. **Update components** for new field names
5. **Test thoroughly**

