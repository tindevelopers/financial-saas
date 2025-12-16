#!/bin/bash

# Script to apply SaaS base migrations to Supabase
# This script will help you apply migrations via Supabase SQL Editor

echo "🚀 Applying @tindeveloper/tinadmin-saas-base migrations to Supabase"
echo "=================================================================="
echo ""

# Check if migrations directory exists
if [ ! -d "supabase/migrations" ]; then
    echo "❌ supabase/migrations directory not found"
    echo "   Run: cp -r node_modules/@tindeveloper/tinadmin-saas-base/supabase/migrations supabase/"
    exit 1
fi

# Count migrations
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
echo "📦 Found $MIGRATION_COUNT migration files"
echo ""

# List migrations in order
echo "📋 Migration files (apply in this order):"
ls -1 supabase/migrations/*.sql | sort | nl
echo ""

echo "🔧 Application Methods:"
echo ""
echo "Method 1: Supabase Dashboard (Recommended)"
echo "  1. Go to: https://supabase.com/dashboard/project/$(echo $NEXT_PUBLIC_SUPABASE_URL | cut -d'/' -f3 | cut -d'.' -f1)"
echo "  2. Navigate to: SQL Editor"
echo "  3. Copy each migration file content and run in order"
echo ""

echo "Method 2: Supabase CLI"
echo "  supabase db push"
echo ""

echo "Method 3: Direct SQL (using psql)"
if command -v psql &> /dev/null; then
    echo "  psql \$DATABASE_URL < supabase/migrations/[filename].sql"
else
    echo "  (psql not installed - install PostgreSQL client tools)"
fi
echo ""

echo "⚠️  Important Notes:"
echo "  - Some migrations may conflict with your existing schema"
echo "  - Review migrations before applying (especially create_users_tenants_roles.sql)"
echo "  - Your existing 'users' and 'tenants' tables may need to be adapted"
echo "  - RLS policies will enhance security but may require testing"
echo ""

echo "📝 To review a migration:"
echo "  cat supabase/migrations/[filename].sql"
echo ""

