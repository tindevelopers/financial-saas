# Testing Admin Panel Locally

## Current Setup

Your local `.env` is configured to use the **production Supabase database**. This means:
- When you run `npm run dev` locally, it connects to the production database
- The `systemadmin@tin.info` user exists in the production database
- This is fine for development, but be careful not to modify production data

## Testing Admin Login Locally

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Access the admin login page:**
   - Regular domain: `http://localhost:3000/auth/signin`
   - Admin subdomain: `http://admin.localhost:3000/auth/signin` (requires `/etc/hosts` setup)

3. **Sign in with admin credentials:**
   - Email: `systemadmin@tin.info`
   - Password: `88888888` (from create-system-admin.ts)

4. **Expected behavior:**
   - After sign-in, the app checks `/api/admin/check-access`
   - If user has 'Platform Admin' or 'System Admin' role, redirects to `/admin/dashboard`
   - Otherwise, redirects to `/dashboard`

## Using Local Supabase (Optional)

If you want to use a **local Supabase instance** instead of production:

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Start local Supabase:**
   ```bash
   supabase start
   ```

3. **Update `.env.local` for local development:**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
   NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<from supabase status>"
   SUPABASE_SERVICE_ROLE_KEY="<from supabase status>"
   ```

4. **Run migrations:**
   ```bash
   npx prisma db push
   ```

5. **Create system admin:**
   ```bash
   npx tsx scripts/create-system-admin.ts
   ```

## Troubleshooting

### Admin check fails
- Verify user exists: Run the check script above
- Verify user has correct role: Should be 'Platform Admin' or 'System Admin'
- Check browser console for errors

### Database connection issues
- Verify `.env` has correct `DATABASE_URL`
- Check if Supabase is accessible
- Verify network connectivity

### Redirect loops
- Check middleware routing logic
- Verify admin subdomain detection
- Check browser console for errors

