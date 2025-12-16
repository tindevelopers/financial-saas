-- Fix connection pooler user mapping
-- The pooler uses postgres.[project-ref] format which needs to work with PostgreSQL

-- 1. Check current roles
SELECT 
  rolname,
  rolsuper,
  rolcanlogin,
  rolcreatedb
FROM pg_roles
WHERE rolname IN ('postgres', 'authenticated', 'service_role', 'anon')
ORDER BY rolname;

-- 2. The connection pooler user format postgres.[project-ref] should map to postgres role
-- But we need to ensure postgres role has all permissions
-- (This should already be done by fix-pooler-user-permissions.sql)

-- 3. Create a function to test if we can insert as postgres role
-- This simulates what Prisma does
DO $$
DECLARE
  test_id UUID;
BEGIN
  -- Try to insert a test tenant
  INSERT INTO tenants (id, name, domain, status, plan, region, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Pooler Test',
    'pooler-test-' || extract(epoch from now())::text || '.example.com',
    'active',
    'free',
    'us-east-1',
    NOW(),
    NOW()
  )
  RETURNING id INTO test_id;
  
  RAISE NOTICE '✅ Successfully inserted as current role. Test ID: %', test_id;
  
  -- Clean up
  DELETE FROM tenants WHERE id = test_id;
  RAISE NOTICE '✅ Test record cleaned up';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Failed to insert: %', SQLERRM;
    RAISE NOTICE 'Current user: %', current_user;
    RAISE NOTICE 'Current role: %', current_setting('role');
END $$;

-- 4. Verify RLS policies allow postgres role
SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tenants'
  AND (
    'postgres' = ANY(roles::text[])
    OR roles IS NULL  -- NULL means all roles
  )
ORDER BY policyname;
