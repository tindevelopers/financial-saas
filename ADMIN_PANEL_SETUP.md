# Admin Panel Setup Guide

## Overview

This guide explains how to set up a separate admin panel accessible via `admin.domain.com` subdomain, with a completely different UI from the user-facing application.

## Architecture Options

### Option 1: Subdomain Routing (Recommended)
- **Admin URL**: `admin.financial-saas-ecru.vercel.app` or `admin.yourdomain.com`
- **User URL**: `financial-saas-ecru.vercel.app` or `yourdomain.com`
- **Implementation**: Middleware detects subdomain and routes to admin pages
- **Pros**: Clean separation, easy to configure DNS, separate deployments possible
- **Cons**: Requires DNS/subdomain configuration

### Option 2: Path-Based Routing
- **Admin URL**: `yourdomain.com/admin/*`
- **User URL**: `yourdomain.com/*`
- **Implementation**: Route groups in Next.js App Router
- **Pros**: No DNS changes needed, simpler setup
- **Cons**: Less separation, shared middleware

### Option 3: Separate Deployment
- **Admin App**: Separate Next.js app deployed to `admin.yourdomain.com`
- **User App**: Current app at `yourdomain.com`
- **Pros**: Complete separation, independent deployments
- **Cons**: More complex, shared database/auth

## Recommended: Option 1 (Subdomain Routing)

We'll implement subdomain routing using Next.js middleware to detect the subdomain and route accordingly.

## Implementation Plan

1. **Update Middleware** - Detect admin subdomain and route to admin pages
2. **Create Admin Layout** - Use tinadmin-saas-base components
3. **Create Admin Pages** - Dashboard, users, tenants, settings
4. **Role Checking** - Verify user has Platform Admin or System Admin role
5. **Admin Navigation** - Separate nav for admin interface

## Role Detection

Admin roles:
- **Platform Admin** - Full system control
- **System Admin** - Full system control (custom role we created)

User roles:
- **Workspace Admin** - Tenant-level admin
- **Billing Owner** - Billing management
- **Developer** - API access
- **Viewer** - Read-only
- **Owner/Member** - Standard users
