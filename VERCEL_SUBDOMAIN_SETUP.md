# Vercel Subdomain Setup Guide

## Quick Answer

**You don't need to point the subdomain anywhere!** Vercel automatically handles all subdomains of your deployment.

## Step-by-Step Instructions

### 1. Add Domain in Vercel Dashboard

1. Go to **Vercel Dashboard** → Your Project (`financial-saas`)
2. Click **Settings** tab
3. Click **Domains** in the sidebar
4. Click **Add Domain** button
5. Enter: `admin.financial-saas-ecru.vercel.app`
6. Click **Add**

Vercel will automatically:
- ✅ Verify the domain
- ✅ Configure SSL certificate
- ✅ Route traffic to your deployment

### 2. How It Works

When someone visits `admin.financial-saas-ecru.vercel.app`:

1. **Vercel** receives the request and routes it to your Next.js app
2. **Middleware** (`middleware.ts`) detects the `admin` subdomain:
   ```typescript
   const hostname = request.headers.get('host') || ''
   const subdomain = hostname.split('.')[0]  // Gets "admin"
   const isAdminSubdomain = subdomain === 'admin'
   ```
3. **Middleware** redirects to `/admin` routes if needed
4. **Admin Layout** checks user role and shows admin interface

### 3. Testing

After adding the domain in Vercel:

1. **Wait 1-2 minutes** for DNS propagation
2. Visit: `https://admin.financial-saas-ecru.vercel.app`
3. Sign in with admin credentials (`systemadmin@tin.info`)
4. You should see the admin dashboard

### 4. For Custom Domains

If you're using a custom domain (e.g., `yourdomain.com`):

1. **Add both domains in Vercel**:
   - `yourdomain.com`
   - `admin.yourdomain.com`

2. **Configure DNS** (in your DNS provider):
   - Add CNAME record: `admin` → `cname.vercel-dns.com`
   - Or A record pointing to Vercel IPs

3. **Vercel will handle the rest** - no additional configuration needed

### 5. How Middleware Routes

```
Request: admin.financial-saas-ecru.vercel.app/
  ↓
Middleware detects "admin" subdomain
  ↓
Redirects to: admin.financial-saas-ecru.vercel.app/admin
  ↓
Admin Layout checks user role
  ↓
Shows admin dashboard (if admin) or redirects (if not admin)
```

```
Request: financial-saas-ecru.vercel.app/
  ↓
Middleware detects no "admin" subdomain
  ↓
Routes normally to user pages
  ↓
User dashboard shown
```

## Troubleshooting

### Domain not working?
- Wait 1-2 minutes for DNS propagation
- Check Vercel dashboard shows domain as "Valid"
- Try accessing `https://admin.financial-saas-ecru.vercel.app/admin` directly

### Getting redirected?
- Check user role in database (should be "Platform Admin" or "System Admin")
- Check browser console for errors
- Verify middleware is running (check Vercel logs)

### SSL certificate issues?
- Vercel automatically provisions SSL certificates
- Wait a few minutes after adding domain
- Check Vercel dashboard for certificate status

## Summary

**No pointing needed!** Just:
1. Add `admin.financial-saas-ecru.vercel.app` in Vercel Dashboard → Settings → Domains
2. Wait 1-2 minutes
3. Access `https://admin.financial-saas-ecru.vercel.app`
4. Sign in as admin
5. Done! ✅

The middleware handles all the routing logic automatically.
