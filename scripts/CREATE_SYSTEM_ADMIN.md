# Create System Admin User

This script creates a system administrator user with full access to all SaaS base menus and features.

## Prerequisites

1. **Supabase Service Role Key**: Required for admin operations
   - Get it from: Supabase Dashboard → Project Settings → API → `service_role` key
   - Add to `.env`: `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`

2. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)
   - `DATABASE_URL` - Database connection string

## Usage

```bash
# Make sure you have the service role key in .env
npx tsx scripts/create-system-admin.ts
```

## What It Does

1. **Creates user in Supabase Auth**
   - Email: `systemadmin@tin.info`
   - Password: `88888888`
   - Auto-confirms email

2. **Creates user profile in database**
   - Links to Supabase Auth user
   - Assigns System Admin role (or Platform Admin if System Admin doesn't exist)

3. **Grants full access**
   - Creates System Admin role with all permissions if it doesn't exist
   - Grants access to ALL existing tenants
   - Grants access to ALL existing workspaces
   - Sets permissions to 'all' for all workspaces

4. **Role Permissions**
   The System Admin role includes:
   - All permissions
   - Billing management
   - API keys management
   - Audit logs access
   - User management
   - Tenant management
   - Workspace management
   - Role management
   - System settings
   - Database access
   - Feature flags
   - Webhooks
   - Usage reports
   - View dashboards
   - View reports
   - Workspace settings
   - Branding
   - Data residency
   - Automations

## Credentials

After running the script, you can sign in with:
- **Email**: `systemadmin@tin.info`
- **Password**: `88888888`

## Troubleshooting

### Error: Missing SUPABASE_SERVICE_ROLE_KEY

Make sure you've added the service role key to your `.env` file:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ Security Note**: Never commit the service role key to git. It has admin privileges.

### Error: User already exists

If the user already exists, the script will:
- Update the password
- Confirm the email
- Update the user profile
- Grant access to any new tenants/workspaces

### Error: Database connection

Make sure `DATABASE_URL` is set correctly in your `.env` file.
