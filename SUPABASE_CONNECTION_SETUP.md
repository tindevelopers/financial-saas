# Supabase Connection Setup for Vercel

## Problem
If you're seeing errors like:
```
Can't reach database server at `db.xxx.supabase.co:5432`
```

This means you're using the **direct connection** URL instead of the **connection pooler** URL.

## Solution

### For Vercel/Serverless Environments

You **MUST** use Supabase's **Connection Pooling** connection string, not the direct connection.

### How to Get the Correct Connection String

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Scroll down to **Connection Pooling**
4. Copy the **Connection string** under **Transaction mode** (recommended for Prisma)
   - It should look like: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Notice the port is **6543** (not 5432) and includes `?pgbouncer=true`

### Setting in Vercel

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Set `DATABASE_URL` to the **Connection Pooling** URL (port 6543)
4. **Do NOT** use the direct connection URL (port 5432)

### Connection String Formats

**❌ WRONG (Direct Connection - won't work in serverless):**
```
postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
```

**✅ CORRECT (Connection Pooler - works in serverless):**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### For Local Development

For local development, you can use either:
- The direct connection (port 5432) - faster for local
- The connection pooler (port 6543) - same as production

### Optional: Direct URL for Migrations

If you need to run migrations, you can optionally set `DIRECT_URL` for local development:
```env
DATABASE_URL="postgresql://...pooler.supabase.com:6543/..." # For app
DIRECT_URL="postgresql://...db.supabase.co:5432/..." # For migrations only
```

The Prisma schema is configured to use `DIRECT_URL` for migrations if available, otherwise falls back to `DATABASE_URL`.
