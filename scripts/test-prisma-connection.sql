-- Test script to verify Prisma can insert data
-- Run this to test if the connection has proper permissions

-- Test 1: Check if we can insert into tenants
DO $$
DECLARE
  test_tenant_id UUID;
BEGIN
  -- Try to insert a test tenant (include all required fields)
  INSERT INTO tenants (id, name, domain, status, plan, region, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Test Tenant',
    'test-' || extract(epoch from now())::text || '.example.com',
    'active',
    'free',
    'us-east-1',
    NOW(),
    NOW()
  )
  RETURNING id INTO test_tenant_id;
  
  RAISE NOTICE '✅ Successfully inserted test tenant: %', test_tenant_id;
  
  -- Clean up
  DELETE FROM tenants WHERE id = test_tenant_id;
  RAISE NOTICE '✅ Test tenant cleaned up';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Failed to insert tenant: %', SQLERRM;
END $$;

-- Test 2: Check if roles table is readable
DO $$
DECLARE
  role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_count FROM roles;
  RAISE NOTICE '✅ Roles table is readable. Found % roles', role_count;
  
  IF role_count = 0 THEN
    RAISE WARNING '⚠️  No roles found. You may need to create default roles.';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Failed to read roles: %', SQLERRM;
END $$;

-- Test 3: Check current user and permissions
SELECT 
  current_user as connection_user,
  current_setting('role') as current_role,
  has_table_privilege('postgres', 'tenants', 'INSERT') as can_insert_tenants,
  has_table_privilege('postgres', 'users', 'INSERT') as can_insert_users,
  has_table_privilege('postgres', 'roles', 'SELECT') as can_select_roles;
