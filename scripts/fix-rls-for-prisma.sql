-- Fix RLS policies to allow Prisma to insert data
-- Prisma doesn't set auth.uid() context, so we need to allow inserts without auth checks

-- 1. Ensure RLS is enabled but policies allow service role and postgres role
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 2. Grant permissions to postgres role (used by connection pooler)
GRANT ALL ON public.tenants TO postgres;
GRANT ALL ON public.users TO postgres;
GRANT ALL ON public.roles TO postgres;
GRANT ALL ON public.categories TO postgres;
GRANT ALL ON public.workspaces TO postgres;
GRANT ALL ON public.workspace_users TO postgres;

-- 3. Drop existing INSERT policies that might block Prisma
DROP POLICY IF EXISTS "Allow tenant creation during signup" ON tenants;
DROP POLICY IF EXISTS "Allow user creation during signup" ON users;
DROP POLICY IF EXISTS "Allow tenant creation via Prisma" ON tenants;
DROP POLICY IF EXISTS "Allow user creation via Prisma" ON users;
DROP POLICY IF EXISTS "Allow role reads via Prisma" ON roles;
DROP POLICY IF EXISTS "Allow category creation via Prisma" ON categories;

-- 4. Create policies that allow INSERT without auth.uid() requirement
-- This allows Prisma (which doesn't set auth context) to insert data
CREATE POLICY "Allow tenant creation via Prisma"
  ON tenants FOR INSERT
  TO postgres, service_role, authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow user creation via Prisma"
  ON users FOR INSERT
  TO postgres, service_role, authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow role reads via Prisma"
  ON roles FOR SELECT
  TO postgres, service_role, authenticated, anon
  USING (true);

CREATE POLICY "Allow category creation via Prisma"
  ON categories FOR INSERT
  TO postgres, service_role, authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow workspace creation via Prisma"
  ON workspaces FOR INSERT
  TO postgres, service_role, authenticated, anon
  WITH CHECK (true);

-- 5. Fix the create_default_workspace trigger to explicitly set id
DROP TRIGGER IF EXISTS create_default_workspace_trigger ON tenants;
DROP FUNCTION IF EXISTS create_default_workspace() CASCADE;

CREATE OR REPLACE FUNCTION create_default_workspace()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspaces (id, tenant_id, name, slug, description, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.name || ' Workspace',
    'default',
    'Default workspace for ' || NEW.name,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_default_workspace_trigger
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION create_default_workspace();

-- 6. Keep existing SELECT policies for tenant isolation (for client queries)
-- These will still work for Supabase client queries that have auth context

-- 7. Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('tenants', 'users', 'roles', 'categories', 'workspaces')
ORDER BY tablename, policyname;
