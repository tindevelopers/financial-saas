# Database Setup Verification

Run the verification script to confirm your database is set up correctly.

## Quick Verification

Run this in **Supabase SQL Editor**:

```sql
-- Quick check: Tables and Roles
SELECT 
  'Tables' as type,
  COUNT(*) FILTER (WHERE table_name IN ('tenants', 'users', 'roles', 'categories')) as found,
  4 as required
FROM information_schema.tables 
WHERE table_schema = 'public';

SELECT 
  'Roles' as type,
  COUNT(*) FILTER (WHERE name = 'Viewer') as found,
  1 as required
FROM roles;
```

## Full Verification

1. Go to **Supabase Dashboard → SQL Editor**
2. Copy and paste the contents of `scripts/verify-database-setup.sql`
3. Run the query
4. Review the results

## Expected Results

✅ **Tables Check**: Should show all 4 tables (tenants, users, roles, categories)
✅ **Roles Check**: Should show at least "Viewer" role (and ideally Owner, Admin, Member)
✅ **Table Structure**: Should show correct column counts
✅ **Indexes Check**: Should show required indexes exist
✅ **SUMMARY**: Should say "All checks passed - Database is ready!"

## If Verification Fails

- **Missing tables**: Run the table creation SQL again
- **Missing roles**: Run the roles creation SQL
- **Missing indexes**: The indexes should be created automatically, but you can add them manually if needed

## Next Steps After Verification

Once verification passes:
1. ✅ Database tables exist
2. ✅ Default roles exist (including "Viewer")
3. ✅ Connection pooler is configured
4. ✅ Application is deployed

**You can now test the signup functionality!**
