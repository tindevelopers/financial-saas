#!/bin/bash

# Script to apply SaaS base migrations to Supabase
# This script helps you apply migrations via Supabase SQL Editor

set -e

echo "🚀 SaaS Base Migration Application Guide"
echo "=========================================="
echo ""

MIGRATIONS_DIR="supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

# Count migrations
MIGRATION_COUNT=$(ls -1 $MIGRATIONS_DIR/*.sql 2>/dev/null | wc -l | tr -d ' ')
echo "📦 Found $MIGRATION_COUNT migration files"
echo ""

# Group migrations by type
echo "📋 Migration Groups:"
echo ""
echo "1️⃣  BASE STRUCTURE (Apply First):"
ls -1 $MIGRATIONS_DIR/20251204211105*.sql 2>/dev/null | sed 's/^/   /' || echo "   (none)"
echo ""

echo "2️⃣  RLS POLICIES (Apply Second):"
ls -1 $MIGRATIONS_DIR/202512042200*.sql 2>/dev/null | sed 's/^/   /' || echo "   (none)"
echo ""

echo "3️⃣  AUDIT LOGS:"
ls -1 $MIGRATIONS_DIR/*audit*.sql 2>/dev/null | sed 's/^/   /' || echo "   (none)"
echo ""

echo "4️⃣  WORKSPACES:"
ls -1 $MIGRATIONS_DIR/*workspace*.sql 2>/dev/null | sed 's/^/   /' || echo "   (none)"
echo ""

echo "5️⃣  STRIPE BILLING:"
ls -1 $MIGRATIONS_DIR/*stripe*.sql 2>/dev/null | sed 's/^/   /' || echo "   (none)"
echo ""

echo "6️⃣  CRM TABLES:"
ls -1 $MIGRATIONS_DIR/*crm*.sql 2>/dev/null | sed 's/^/   /' || echo "   (none)"
echo ""

echo "7️⃣  OTHER FIXES:"
ls -1 $MIGRATIONS_DIR/2025120[6-9]*.sql 2>/dev/null | sed 's/^/   /' || echo "   (none)"
echo ""

echo "🔧 How to Apply:"
echo ""
echo "Method 1: Supabase Dashboard (Recommended)"
echo "   1. Open: https://supabase.com/dashboard/project/aejlgccswnauirqyzrzl/sql"
echo "   2. Copy each migration file content"
echo "   3. Paste and run in SQL Editor"
echo "   4. Apply in chronological order (by filename)"
echo ""

echo "Method 2: Combined File"
echo "   A combined file is available:"
echo "   📄 supabase/all-migrations-combined.sql"
echo "   ⚠️  Review before applying - contains all migrations"
echo ""

echo "⚠️  Important Warnings:"
echo ""
echo "   • The first migration creates users/tenants/roles tables"
echo "   • Your existing tables will need to be migrated"
echo "   • IDs will change from TEXT (cuid) to UUID"
echo "   • Backup your data before applying!"
echo ""

echo "📝 Quick Apply (copy-paste ready):"
echo ""
echo "   # List all migrations in order:"
echo "   ls -1 $MIGRATIONS_DIR/*.sql | sort"
echo ""

echo "✅ After applying migrations:"
echo "   1. Run: yarn prisma db pull (to sync Prisma schema)"
echo "   2. Run: yarn prisma generate"
echo "   3. Update your code to use new field names"
echo "   4. Test authentication and tenant isolation"
echo ""

