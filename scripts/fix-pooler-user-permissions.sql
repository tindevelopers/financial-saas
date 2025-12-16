-- Fix permissions for connection pooler user
-- The pooler uses postgres.[project-ref] format which needs to map to postgres role

-- 1. Ensure postgres role exists and has all necessary permissions
DO $$
BEGIN
  -- Check if postgres role exists
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    RAISE EXCEPTION 'postgres role does not exist';
  END IF;
  
  RAISE NOTICE '✅ postgres role exists';
END $$;

-- 2. Grant all necessary permissions to postgres role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- 3. Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;

-- 4. Note: Cannot alter postgres role (requires superuser)
-- RLS policies should allow postgres role to insert (handled in fix-rls-for-prisma.sql)

-- 5. Verify grants
SELECT 
  'Table Grants' as grant_type,
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('tenants', 'users', 'roles', 'categories', 'workspaces')
  AND grantee = 'postgres'
ORDER BY table_name, privilege_type;

-- 6. Verify postgres role exists and check its properties
SELECT 
  rolname,
  rolsuper as is_superuser,
  rolcanlogin as can_login,
  rolcreatedb as can_create_db
FROM pg_roles
WHERE rolname = 'postgres';
