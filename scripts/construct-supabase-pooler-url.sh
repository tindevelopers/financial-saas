#!/bin/bash

# Script to construct Supabase Connection Pooler URL
# 
# Usage: ./scripts/construct-supabase-pooler-url.sh

echo "=========================================="
echo "Construct Supabase Connection Pooler URL"
echo "=========================================="
echo ""
echo "Your project reference: aejlgccswnauirqyzrzl"
echo ""
echo "We need a few details to construct your connection string:"
echo ""

# Get database password
read -sp "Enter your database password: " DB_PASSWORD
echo ""

# Get region (common ones: us-east-1, us-west-1, eu-west-1, ap-southeast-1)
echo ""
echo "Common regions:"
echo "  - us-east-1 (US East)"
echo "  - us-west-1 (US West)"
echo "  - eu-west-1 (Europe)"
echo "  - ap-southeast-1 (Asia Pacific)"
echo ""
read -p "Enter your region (e.g., us-east-1): " REGION

# Construct the connection string
CONNECTION_STRING="postgresql://postgres.aejlgccswnauirqyzrzl:${DB_PASSWORD}@aws-0-${REGION}.pooler.supabase.com:6543/postgres?pgbouncer=true"

echo ""
echo "=========================================="
echo "Your Connection Pooler URL:"
echo "=========================================="
echo ""
echo "$CONNECTION_STRING"
echo ""
echo "=========================================="
echo ""
echo "To add this to Vercel, run:"
echo "  vercel env add DATABASE_URL production"
echo ""
echo "Then paste the connection string above when prompted."
echo ""
