# Admin Panel Setup Guide

## Overview

The admin panel is now separated from the user interface and accessible via `admin.domain.com` subdomain. Admin users (Platform Admin or System Admin) will automatically be redirected to the admin interface.

## Architecture

### Subdomain Routing
- **Admin URL**: `admin.financial-saas-ecru.vercel.app` (or `admin.yourdomain.com`)
- **User URL**: `financial-saas-ecru.vercel.app` (or `yourdomain.com`)
- **Implementation**: Middleware detects `admin` subdomain and routes to `/admin/*` pages

### Role-Based Access
- **Admin Roles**: Platform Admin, System Admin
- **User Roles**: Workspace Admin, Billing Owner, Developer, Viewer, Owner, Member
- **Access Control**: Admin routes check role before allowing access

## Features

### Admin Dashboard (`/admin`)
- System statistics (tenants, users, transactions, uploads)
- Quick actions for common tasks
- Overview of system health

### Admin Pages
1. **Tenants** (`/admin/tenants`)
   - View all tenants/organizations
   - See tenant details, status, plan
   - View user and transaction counts per tenant

2. **Users** (`/admin/users`)
   - View all system users
   - See user roles, tenants, status
   - Manage user access

3. **Settings** (`/admin/settings`)
   - System-wide configuration
   - Feature flags
   - Global settings

## How It Works

### 1. Subdomain Detection
Middleware checks the `host` header:
- If subdomain is `admin` → Route to admin pages
- Otherwise → Route to regular user pages

### 2. Role Checking
- Admin API routes use `requireAdmin()` helper
- Checks if user has Platform Admin or System Admin role
- Returns 403 if user is not admin

### 3. Automatic Redirects
- Admin users signing in → Redirected to `admin.domain.com`
- Admin users accessing regular domain → Redirected to admin subdomain
- Regular users accessing admin subdomain → Redirected to regular domain

## Setup Instructions

### Option 1: Vercel Subdomain (Easiest)

1. **Add Subdomain in Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Add `admin.yourdomain.com` (or `admin.financial-saas-ecru.vercel.app`)
   - Vercel will automatically handle routing

2. **Test Locally**:
   - Add to `/etc/hosts`: `127.0.0.1 admin.localhost`
   - Access: `http://admin.localhost:3000`

### Option 2: Custom Domain

1. **DNS Configuration**:
   - Add CNAME record: `admin` → `your-vercel-deployment.vercel.app`
   - Or A record pointing to Vercel IPs

2. **Vercel Configuration**:
   - Add domain in Vercel dashboard
   - Both `yourdomain.com` and `admin.yourdomain.com` should point to same deployment

### Option 3: Path-Based (No DNS Changes)

If you prefer not to use subdomains, you can use path-based routing:
- Admin: `yourdomain.com/admin/*`
- Users: `yourdomain.com/*`

Update middleware to check path instead of subdomain.

## Testing

1. **Sign in as System Admin** (`systemadmin@tin.info`):
   ```
   - Should redirect to admin.domain.com/admin
   - Should see admin dashboard
   - Should see admin navigation
   ```

2. **Sign in as Regular User**:
   ```
   - Should stay on regular domain
   - Should see user dashboard
   - Should NOT see admin navigation
   ```

3. **Access Admin Routes**:
   ```
   - Admin user: ✅ Allowed
   - Regular user: ❌ Redirected to /dashboard
   ```

## Admin UI Components

The admin panel uses a clean, professional interface:
- Sidebar navigation
- Card-based layouts
- Tables for data display
- Stats cards for overview
- Consistent with tinadmin-saas-base design patterns

## Future Enhancements

1. **More Admin Pages**:
   - Audit logs viewer
   - System health monitoring
   - Feature flag management
   - Billing overview

2. **Admin Actions**:
   - Suspend/activate tenants
   - Manage user roles
   - View system logs
   - Export system data

3. **Integration with tinadmin-saas-base**:
   - Use more components from the package
   - Add SaaS-specific admin features
   - Implement full admin UI from package

## Troubleshooting

### Admin user sees regular dashboard
- Check user role in database: Should be "Platform Admin" or "System Admin"
- Check middleware is detecting subdomain correctly
- Verify `/api/admin/check-access` returns 200

### Subdomain not working
- Check DNS configuration
- Verify Vercel domain settings
- Check middleware logs for subdomain detection

### 403 Forbidden on admin routes
- Verify user has correct role
- Check `requireAdmin()` function
- Ensure role name matches exactly: "Platform Admin" or "System Admin"
