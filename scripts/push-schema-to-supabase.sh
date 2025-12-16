#!/bin/bash

# Script to push Prisma schema to Supabase using direct connection
# This is needed because Prisma migrations require direct connection, not pooler

echo "=========================================="
echo "Push Prisma Schema to Supabase"
echo "=========================================="
echo ""
echo "This script will push your Prisma schema to Supabase."
echo "Note: Schema operations require direct connection (port 5432), not pooler."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not set"
  echo ""
  echo "Please set DATABASE_URL to your Supabase DIRECT connection:"
  echo "  export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.aejlgccswnauirqyzrzl.supabase.co:5432/postgres'"
  exit 1
fi

# Check if using pooler
if [[ "$DATABASE_URL" == *"pooler"* ]] || [[ "$DATABASE_URL" == *":6543"* ]]; then
  echo "⚠️  Warning: DATABASE_URL appears to be using connection pooler"
  echo "   Schema operations require direct connection (port 5432)"
  echo ""
  echo "Please set DATABASE_URL to direct connection:"
  echo "  postgresql://postgres:[PASSWORD]@db.aejlgccswnauirqyzrzl.supabase.co:5432/postgres"
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "📦 Pushing Prisma schema to database..."
echo ""

# Run Prisma db push
npx prisma db push --accept-data-loss

echo ""
echo "=========================================="
echo "✅ Schema push complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify tables were created in Supabase Dashboard"
echo "2. The connection pooler URL should now work for application operations"
echo ""
