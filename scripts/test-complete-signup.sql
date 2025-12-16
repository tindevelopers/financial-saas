-- Complete signup flow test
-- This simulates the entire signup process that Prisma will execute
-- Run this to verify everything works before testing the actual API

DO $$
DECLARE
  -- Simulate Supabase Auth user ID
  test_auth_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test-' || extract(epoch from now())::text || '@example.com';
  test_name TEXT := 'Test User';
  
  -- Will be populated during test
  test_tenant_id UUID;
  test_role_id UUID;
  test_user_profile_id UUID;
  category_count INTEGER;
  workspace_count INTEGER;
BEGIN
  RAISE NOTICE '🧪 Testing Complete Signup Flow';
  RAISE NOTICE '================================';
  RAISE NOTICE '';
  
  -- Step 1: Verify Viewer role exists (required for signup)
  SELECT id INTO test_role_id FROM roles WHERE name = 'Viewer' LIMIT 1;
  
  IF test_role_id IS NULL THEN
    RAISE EXCEPTION '❌ CRITICAL: Viewer role not found. Signup will fail.';
  END IF;
  
  RAISE NOTICE '✅ Step 1: Viewer role found: %', test_role_id;
  
  -- Step 2: Create tenant (this is what Prisma does first)
  -- This should trigger the default workspace creation
  INSERT INTO tenants (id, name, domain, status, plan, region, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    test_name || '''s Company',
    split_part(test_email, '@', 1) || '.' || split_part(test_email, '@', 2),
    'active',
    'free',
    'us-east-1',
    NOW(),
    NOW()
  )
  RETURNING id INTO test_tenant_id;
  
  RAISE NOTICE '✅ Step 2: Tenant created: %', test_tenant_id;
  RAISE NOTICE '   Name: %', test_name || '''s Company';
  RAISE NOTICE '   Domain: %', split_part(test_email, '@', 1) || '.' || split_part(test_email, '@', 2);
  
  -- Step 3: Verify default workspace was created by trigger
  SELECT COUNT(*) INTO workspace_count 
  FROM workspaces 
  WHERE tenant_id = test_tenant_id;
  
  IF workspace_count > 0 THEN
    RAISE NOTICE '✅ Step 3: Default workspace created automatically (count: %)', workspace_count;
  ELSE
    RAISE WARNING '⚠️  Step 3: No workspace created. Trigger may need fixing.';
  END IF;
  
  -- Step 4: Create user profile (uses tenant_id from step 2)
  INSERT INTO users (id, email, full_name, tenant_id, role_id, plan, status, created_at, updated_at)
  VALUES (
    test_auth_user_id,
    test_email,
    test_name,
    test_tenant_id,
    test_role_id,
    'free',
    'active',
    NOW(),
    NOW()
  )
  RETURNING id INTO test_user_profile_id;
  
  RAISE NOTICE '✅ Step 4: User profile created: %', test_user_profile_id;
  RAISE NOTICE '   Email: %', test_email;
  RAISE NOTICE '   Tenant ID: %', test_tenant_id;
  RAISE NOTICE '   Role ID: %', test_role_id;
  
  -- Step 5: Create default categories (same as signup route does)
  INSERT INTO categories (id, tenant_id, name, type, description, is_default, is_active, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), test_tenant_id, 'Sales', 'income', 'Revenue from sales', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Other Income', 'income', 'Miscellaneous income', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Interest Income', 'income', 'Interest earned', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Cost of Goods Sold', 'expense', 'Direct costs', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Advertising', 'expense', 'Marketing expenses', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Bank Charges', 'expense', 'Bank fees', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Office Expenses', 'expense', 'Office supplies', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Professional Fees', 'expense', 'Legal, accounting fees', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Rent', 'expense', 'Property rent', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Utilities', 'expense', 'Electricity, gas, water', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Travel', 'expense', 'Business travel', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Meals & Entertainment', 'expense', 'Client meals', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Insurance', 'expense', 'Business insurance', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Repairs & Maintenance', 'expense', 'Repairs', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Telephone & Internet', 'expense', 'Communications', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Subscriptions', 'expense', 'Software subscriptions', true, true, NOW(), NOW()),
    (gen_random_uuid(), test_tenant_id, 'Drawings', 'expense', 'Owner drawings', true, true, NOW(), NOW());
  
  SELECT COUNT(*) INTO category_count 
  FROM categories 
  WHERE tenant_id = test_tenant_id;
  
  RAISE NOTICE '✅ Step 5: Created % default categories', category_count;
  
  -- Step 6: Final verification
  RAISE NOTICE '';
  RAISE NOTICE '📊 Final Verification:';
  RAISE NOTICE '  ✅ Tenant ID: %', test_tenant_id;
  RAISE NOTICE '  ✅ User Profile ID: %', test_user_profile_id;
  RAISE NOTICE '  ✅ Workspaces: %', workspace_count;
  RAISE NOTICE '  ✅ Categories: %', category_count;
  RAISE NOTICE '  ✅ Role: Viewer (%)', test_role_id;
  
  -- Clean up test data
  RAISE NOTICE '';
  RAISE NOTICE '🧹 Cleaning up test data...';
  
  DELETE FROM categories WHERE tenant_id = test_tenant_id;
  DELETE FROM users WHERE id = test_user_profile_id;
  DELETE FROM workspaces WHERE tenant_id = test_tenant_id;
  DELETE FROM tenants WHERE id = test_tenant_id;
  
  RAISE NOTICE '✅ Test data cleaned up';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ALL TESTS PASSED!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Signup flow is ready to test in the application!';
  RAISE NOTICE '   You can now try creating an account through the web interface.';
  
EXCEPTION
  WHEN OTHERS THEN
    -- Try to clean up on error
    BEGIN
      IF test_tenant_id IS NOT NULL THEN
        DELETE FROM categories WHERE tenant_id = test_tenant_id;
        DELETE FROM users WHERE tenant_id = test_tenant_id;
        DELETE FROM workspaces WHERE tenant_id = test_tenant_id;
        DELETE FROM tenants WHERE id = test_tenant_id;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    
    RAISE EXCEPTION '❌ Signup flow test FAILED: %', SQLERRM;
END $$;
