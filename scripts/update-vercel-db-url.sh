#!/bin/bash

# Script to update DATABASE_URL in Vercel to use Supabase Connection Pooler
# 
# Usage:
#   1. Get your Connection Pooler URL from Supabase:
#      - Go to Supabase Dashboard → Settings → Database
#      - Scroll to "Connection Pooling"
#      - Copy the "Connection string" under "Transaction mode"
#      - Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
#
#   2. Run this script and paste the connection string when prompted

echo "=========================================="
echo "Update DATABASE_URL in Vercel"
echo "=========================================="
echo ""
echo "This will update your DATABASE_URL to use Supabase Connection Pooling."
echo "Make sure you have the Connection Pooler URL ready from Supabase Dashboard."
echo ""
echo "Steps to get the URL:"
echo "1. Go to Supabase Dashboard → Settings → Database"
echo "2. Scroll to 'Connection Pooling' section"
echo "3. Copy the 'Connection string' under 'Transaction mode'"
echo "4. It should include port 6543 and ?pgbouncer=true"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "Removing old DATABASE_URL..."
vercel env rm DATABASE_URL production --yes
vercel env rm DATABASE_URL preview --yes
vercel env rm DATABASE_URL development --yes

echo ""
echo "Adding new DATABASE_URL with Connection Pooler..."
echo "Paste your Connection Pooler URL when prompted:"
vercel env add DATABASE_URL production
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development

echo ""
echo "=========================================="
echo "Done! Your DATABASE_URL has been updated."
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Redeploy your application: vercel --prod"
echo "2. Or wait for the next deployment to pick up the new environment variable"
echo ""
