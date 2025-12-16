-- Test script to simulate the signup flow
-- This tests if Prisma can successfully create a tenant, user, and categories
-- Run this in Supabase SQL Editor to verify the fixes work

DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_tenant_id UUID;
  test_user_profile_id UUID;
  test_role_id UUID;
  category_count INTEGER;
  workspace_count INTEGER;
BEGIN
  RAISE NOTICE '🧪 Testing Signup Flow...';
  RAISE NOTICE '================================';
  
  -- Step 1: Get or create a test role (Viewer)
  SELECT id INTO test_role_id FROM roles WHERE name = 'Viewer' LIMIT 1;
  
  IF test_role_id IS NULL THEN
    RAISE EXCEPTION '❌ Viewer role not found. Please create default roles first.';
  END IF;
  
  RAISE NOTICE '✅ Step 1: Found Viewer role: %', test_role_id;
  
  -- Step 2: Create tenant (simulating Prisma tenant.create())
  INSERT INTO tenants (id, name, domain, status, plan, region, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Test Company',
    'test-' || extract(epoch from now())::text || '.example.com',
    'active',
    'free',
    'us-east-1',
    NOW(),
    NOW()
  )
  RETURNING id INTO test_tenant_id;
  
  RAISE NOTICE '✅ Step 2: Created tenant: %', test_tenant_id;
  
  -- Step 3: Check if default workspace was created by trigger
  SELECT COUNT(*) INTO workspace_count 
  FROM workspaces 
  WHERE tenant_id = test_tenant_id;
  
  IF workspace_count > 0 THEN
    RAISE NOTICE '✅ Step 3: Default workspace created by trigger (count: %)', workspace_count;
  ELSE
    RAISE WARNING '⚠️  Step 3: No default workspace created. Trigger may not be working.';
  END IF;
  
  -- Step 4: Create user profile (simulating Prisma user.create())
  INSERT INTO users (id, email, full_name, tenant_id, role_id, plan, status, created_at, updated_at)
  VALUES (
    test_user_id,
    'test-' || extract(epoch from now())::text || '@example.com',
    'Test User',
    test_tenant_id,
    test_role_id,
    'free',
    'active',
    NOW(),
    NOW()
  )
  RETURNING id INTO test_user_profile_id;
  
  RAISE NOTICE '✅ Step 4: Created user profile: %', test_user_profile_id;
  
  -- Step 5: Create default categories (simulating Prisma category.create())
  INSERT INTO categories (id, tenant_id, name, type, description, is_default, is_active, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), test_tenant_id, 'Sales', 'income', 'Revenue from sales', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Advertising', 'expense', 'Marketing expenses', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Rent', 'expense', 'Property rent', true, true, NOW(), NOW());
  
  SELECT COUNT(*) INTO category_count 
  FROM categories 
  WHERE tenant_id = test_tenant_id;
  
  RAISE NOTICE '✅ Step 5: Created % categories', category_count;
  
  -- Step 6: Verify everything was created
  RAISE NOTICE '';
  RAISE NOTICE '📊 Verification:';
  RAISE NOTICE '  - Tenant: %', test_tenant_id;
  RAISE NOTICE '  - User: %', test_user_profile_id;
  RAISE NOTICE '  - Workspaces: %', workspace_count;
  RAISE NOTICE '  - Categories: %', category_count;
  
  -- Clean up test data
  DELETE FROM categories WHERE tenant_id = test_tenant_id;
  DELETE FROM users WHERE id = test_user_profile_id;
  DELETE FROM workspaces WHERE tenant_id = test_tenant_id;
  DELETE FROM tenants WHERE id = test_tenant_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ All steps completed successfully!';
  RAISE NOTICE '✅ Test data cleaned up';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Signup flow should work correctly now!';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Signup flow test failed at step: %', SQLERRM;
END $$;

-- Also verify permissions
SELECT 
  'Permissions Check' as check_type,
  has_table_privilege('postgres', 'tenants', 'INSERT') as can_insert_tenants,
  has_table_privilege('postgres', 'users', 'INSERT') as can_insert_users,
  has_table_privilege('postgres', 'roles', 'SELECT') as can_select_roles,
  has_table_privilege('postgres', 'categories', 'INSERT') as can_insert_categories,
  has_table_privilege('postgres', 'workspaces', 'INSERT') as can_insert_workspaces;
