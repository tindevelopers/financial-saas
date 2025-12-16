-- Diagnose the connection user issue
-- This will help identify what user Prisma is connecting as

-- Check current user and available roles
SELECT 
  current_user as current_connection_user,
  current_setting('role') as current_role,
  session_user as session_user,
  user as user_name;

-- Check if postgres role exists and has permissions
SELECT 
  rolname as role_name,
  rolsuper as is_superuser,
  rolcanlogin as can_login,
  rolcreatedb as can_create_db
FROM pg_roles
WHERE rolname IN ('postgres', 'service_role', 'authenticated', 'anon')
ORDER BY rolname;

-- Check table ownership
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tenants', 'users', 'roles', 'categories', 'workspaces')
ORDER BY tablename;

-- Check grants on tenants table
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'tenants'
ORDER BY grantee, privilege_type;
