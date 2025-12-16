# Applying SaaS Base Migrations to Supabase

This guide explains how to apply migrations from `@tindeveloper/tinadmin-saas-base` to your Supabase database.

## ⚠️ Important Conflicts

The SaaS base migrations expect:
- **UUID** IDs for users/tenants
- Different table structure for `users` and `tenants`

Your current schema uses:
- **TEXT** IDs (cuid) for users/tenants  
- Existing `users` and `tenants` tables

## 📋 Migration Strategy

### Option 1: Apply Only Compatible Migrations (Recommended)

Skip migrations that create conflicting tables, apply the rest:

**Skip these migrations:**
- `20251204211105_create_users_tenants_roles.sql` - Creates conflicting users/tenants tables

**Apply these migrations (in order):**
1. `20251204220000_tenant_isolation_rls.sql` - RLS policies (may need adaptation)
2. `20251204220001_fix_rls_auth.sql` - RLS fixes
3. `20251204220002_fix_rls_unauthenticated.sql` - RLS fixes
4. `20251204220003_fix_tenant_insert.sql` - RLS fixes
5. `20251204220004_fix_function_error.sql` - Function fixes
6. `20251204220005_recreate_rls_policies.sql` - RLS policies
7. `20251204220006_fix_function_schema_references.sql` - Function fixes
8. `20251204220007_disable_rls_for_admin.sql` - RLS admin policies
9. `20251204220008_ensure_function_accessible.sql` - Function accessibility
10. `20251204220009_fix_rls_for_client_queries.sql` - RLS client fixes
11. `20251204220010_fix_tenant_rls_policy.sql` - RLS tenant policy
12. `20251204220011_set_platform_admins_tenant_null.sql` - Admin tenant
13. `20251204220012_update_rls_for_platform_admins.sql` - Admin RLS
14. `20251204220013_add_tenant_constraints.sql` - Tenant constraints
15. `20251204220014_create_audit_logs.sql` - **✅ Audit logs table**
16. `20251205000000_workspaces_schema.sql` - Workspaces (optional)
17. `20251205000001_add_workspace_to_audit_logs.sql` - Workspace audit
18. `20251205000002_user_tenant_roles.sql` - User roles (may need adaptation)
19. `20251205120000_update_role_names.sql` - Role names
20. `20251206000000_add_white_label_settings.sql` - **✅ White label settings**
21. `20251207000000_create_stripe_tables.sql` - **✅ Stripe billing**
22. `20251208000000_create_crm_tables.sql` - **✅ CRM tables**
23. `20251208000001_fix_crm_rls_recursion.sql` - CRM RLS fixes
24. `20251213000000_fix_rls_recursion.sql` - RLS recursion fixes

### Option 2: Adapt Migrations to Your Schema

Modify the first migration to work with your existing schema structure.

## 🚀 How to Apply Migrations

### Method 1: Supabase Dashboard SQL Editor (Easiest)

1. Go to your Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/aejlgccswnauirqyzrzl
   ```

2. Navigate to **SQL Editor**

3. For each migration file (in order):
   - Open: `supabase/migrations/[filename].sql`
   - Copy the contents
   - Paste into SQL Editor
   - Click **Run**

4. **Start with compatible migrations** (skip the first one):
   ```bash
   # List migrations to apply
   ls supabase/migrations/*.sql | tail -n +2
   ```

### Method 2: Supabase CLI

If you have Supabase CLI linked to your project:

```bash
# Link to your project (if not already linked)
supabase link --project-ref aejlgccswnauirqyzrzl

# Apply migrations
supabase db push
```

### Method 3: Combined SQL File

A combined file has been created:
```bash
# Review the combined file
cat supabase/all-migrations-combined.sql

# Then paste into Supabase SQL Editor
```

## 🔧 Adapting RLS Policies

The RLS policies reference `auth.uid()` and expect UUIDs. You may need to adapt them:

1. Change UUID references to TEXT
2. Update function signatures
3. Test policies after applying

## ✅ Recommended Approach

1. **Start with non-conflicting migrations:**
   - Audit logs (`20251204220014_create_audit_logs.sql`)
   - Stripe tables (`20251207000000_create_stripe_tables.sql`)
   - CRM tables (`20251208000000_create_crm_tables.sql`)
   - White label settings (`20251206000000_add_white_label_settings.sql`)

2. **Then adapt RLS policies:**
   - Review each RLS migration
   - Adapt UUID → TEXT where needed
   - Test tenant isolation

3. **Skip conflicting migrations:**
   - The users/tenants/roles creation migration
   - Or adapt it to your schema

## 📝 Quick Apply Script

```bash
# Apply only compatible migrations (skip first)
for file in supabase/migrations/202512042200*.sql supabase/migrations/20251205*.sql supabase/migrations/20251206*.sql supabase/migrations/20251207*.sql supabase/migrations/20251208*.sql supabase/migrations/20251213*.sql; do
  echo "Applying: $(basename $file)"
  # Copy content and paste into Supabase SQL Editor
done
```

## 🧪 Testing After Migration

After applying migrations:

1. Test authentication still works
2. Verify tenant isolation (RLS policies)
3. Check that existing queries still work
4. Test new features (Stripe, CRM, audit logs)

## 📚 Resources

- [Supabase SQL Editor](https://supabase.com/dashboard/project/aejlgccswnauirqyzrzl/sql)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Migration Files Location](./supabase/migrations/)

