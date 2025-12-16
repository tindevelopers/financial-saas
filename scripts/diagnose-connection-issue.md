# Diagnosing "Tenant or user not found" Error

## The Problem

The error "FATAL: Tenant or user not found" when using Prisma with Supabase connection pooler typically means:

1. **Connection pooler user format issue**: The pooler uses `postgres.[project-ref]` format which might not be recognized
2. **RLS blocking operations**: Row Level Security policies require `auth.uid()` which Prisma doesn't set
3. **Missing permissions**: The connection user doesn't have INSERT permissions

## Solutions

### Solution 1: Fix RLS Policies (Recommended)

Run `scripts/fix-rls-for-prisma.sql` in Supabase SQL Editor. This will:
- Grant permissions to the `postgres` role (used by pooler)
- Create policies that allow INSERT without auth.uid() requirement
- Keep SELECT policies for tenant isolation

### Solution 2: Use Service Role Connection (Alternative)

If the pooler doesn't work, you can use the service role connection string:

1. Get your service role connection string from Supabase Dashboard
2. It should look like: `postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres`
3. Update `DATABASE_URL` in Vercel (but note: this won't work in serverless long-term)

### Solution 3: Test Connection First

Run `scripts/test-prisma-connection.sql` to verify:
- Can insert into tenants table
- Can read from roles table
- Connection has proper permissions

## Next Steps

1. Run `fix-rls-for-prisma.sql` in Supabase SQL Editor
2. Test the connection with `test-prisma-connection.sql`
3. If tests pass, try signup again
4. If still failing, check Vercel logs for detailed error messages
