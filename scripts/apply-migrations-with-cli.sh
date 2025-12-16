#!/bin/bash
# Apply Supabase migrations using psql (via DATABASE_URL)

set -e

echo "🚀 Applying Supabase Migrations"
echo "=================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo "   Please set it in your .env file or export it:"
  echo "   export DATABASE_URL='postgresql://...'"
  exit 1
fi

# Get migration files in order
MIGRATIONS_DIR="supabase/migrations"
MIGRATION_FILES=$(ls -1 "$MIGRATIONS_DIR"/*.sql | sort)

if [ -z "$MIGRATION_FILES" ]; then
  echo "❌ Error: No migration files found in $MIGRATIONS_DIR"
  exit 1
fi

echo "📋 Found $(echo "$MIGRATION_FILES" | wc -l | tr -d ' ') migration files"
echo ""

# Track applied migrations
APPLIED_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

# Apply each migration
for migration_file in $MIGRATION_FILES; do
  filename=$(basename "$migration_file")
  echo "📄 Applying: $filename"
  
  # Check if migration was already applied (check migration history table)
  # Note: This assumes Supabase tracks migrations in a _migrations table
  # If not, you may need to manually track or skip this check
  
  # Apply migration
  if psql "$DATABASE_URL" -f "$migration_file" -v ON_ERROR_STOP=1 > /tmp/migration_output.log 2>&1; then
    echo "   ✅ Success"
    ((APPLIED_COUNT++))
  else
    # Check if error is "already exists" or similar (non-critical)
    if grep -q "already exists\|duplicate\|relation.*already exists" /tmp/migration_output.log; then
      echo "   ⚠️  Skipped (already exists)"
      ((SKIPPED_COUNT++))
    else
      echo "   ❌ Failed"
      echo "   Error output:"
      cat /tmp/migration_output.log | grep -A 5 "ERROR\|error" || cat /tmp/migration_output.log
      ((FAILED_COUNT++))
      
      # Ask if we should continue
      read -p "   Continue with next migration? (y/N): " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "❌ Migration stopped by user"
        exit 1
      fi
    fi
  fi
  echo ""
done

echo "=================================="
echo "📊 Migration Summary:"
echo "   ✅ Applied: $APPLIED_COUNT"
echo "   ⚠️  Skipped: $SKIPPED_COUNT"
echo "   ❌ Failed:  $FAILED_COUNT"
echo ""

if [ $FAILED_COUNT -eq 0 ]; then
  echo "✅ All migrations completed successfully!"
  exit 0
else
  echo "⚠️  Some migrations failed. Please review the errors above."
  exit 1
fi

