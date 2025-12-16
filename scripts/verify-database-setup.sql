-- Verification script to confirm database setup
-- Run this in Supabase SQL Editor to verify everything is set up correctly

-- 1. Check if required tables exist
SELECT 
  'Tables Check' as check_type,
  table_name,
  CASE 
    WHEN table_name IN ('tenants', 'users', 'roles', 'categories') THEN '✅ Exists'
    ELSE '⚠️ Missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tenants', 'users', 'roles', 'categories')
ORDER BY table_name;

-- 2. Check if default roles exist
SELECT 
  'Roles Check' as check_type,
  name,
  description,
  CASE 
    WHEN name = 'Viewer' THEN '✅ Required role exists'
    ELSE '✅ Role exists'
  END as status
FROM roles
ORDER BY name;

-- 3. Check table structures (column counts)
SELECT 
  'Table Structure' as check_type,
  table_name,
  COUNT(column_name) as column_count,
  CASE 
    WHEN table_name = 'tenants' AND COUNT(column_name) >= 9 THEN '✅ Structure OK'
    WHEN table_name = 'users' AND COUNT(column_name) >= 10 THEN '✅ Structure OK'
    WHEN table_name = 'roles' AND COUNT(column_name) >= 9 THEN '✅ Structure OK'
    WHEN table_name = 'categories' AND COUNT(column_name) >= 8 THEN '✅ Structure OK'
    ELSE '⚠️ Check structure'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('tenants', 'users', 'roles', 'categories')
GROUP BY table_name
ORDER BY table_name;

-- 4. Check for required indexes
SELECT 
  'Indexes Check' as check_type,
  indexname,
  tablename,
  '✅ Index exists' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    (tablename = 'users' AND indexname LIKE '%tenant_id%') OR
    (tablename = 'users' AND indexname LIKE '%role_id%') OR
    (tablename = 'categories' AND indexname LIKE '%tenant_id%') OR
    (tablename = 'tenants' AND indexname LIKE '%domain%')
  )
ORDER BY tablename, indexname;

-- 5. Summary
SELECT 
  'SUMMARY' as check_type,
  'Database Setup Verification' as message,
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('tenants', 'users', 'roles', 'categories')) = 4
      AND (SELECT COUNT(*) FROM roles WHERE name = 'Viewer') = 1
    THEN '✅ All checks passed - Database is ready!'
    ELSE '⚠️ Some checks failed - Review above'
  END as status;
