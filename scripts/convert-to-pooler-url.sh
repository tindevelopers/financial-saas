#!/bin/bash

# Convert direct connection URL to connection pooler URL
# 
# Your direct URL: postgresql://postgres:[YOUR-PASSWORD]@db.aejlgccswnauirqyzrzl.supabase.co:5432/postgres

echo "=========================================="
echo "Convert to Supabase Connection Pooler URL"
echo "=========================================="
echo ""
echo "Your project reference: aejlgccswnauirqyzrzl"
echo ""
echo "We need your database password and region to construct the pooler URL."
echo ""

# Get database password
read -sp "Enter your database password: " DB_PASSWORD
echo ""

# Get region
echo ""
echo "Common Supabase regions:"
echo "  - us-east-1 (US East - N. Virginia)"
echo "  - us-west-1 (US West - N. California)"
echo "  - eu-west-1 (Europe - Ireland)"
echo "  - eu-central-1 (Europe - Frankfurt)"
echo "  - ap-southeast-1 (Asia Pacific - Singapore)"
echo "  - ap-northeast-1 (Asia Pacific - Tokyo)"
echo ""
echo "If you're not sure, check your Supabase project settings or try us-east-1"
read -p "Enter your region (e.g., us-east-1): " REGION

# Construct the pooler connection string
POOLER_URL="postgresql://postgres.aejlgccswnauirqyzrzl:${DB_PASSWORD}@aws-0-${REGION}.pooler.supabase.com:6543/postgres?pgbouncer=true"

echo ""
echo "=========================================="
echo "Your Connection Pooler URL:"
echo "=========================================="
echo ""
echo "$POOLER_URL"
echo ""
echo "=========================================="
echo ""
echo "Key differences from direct connection:"
echo "  - Username: postgres.[project-ref] (not just postgres)"
echo "  - Hostname: aws-0-[region].pooler.supabase.com (not db.[project-ref].supabase.co)"
echo "  - Port: 6543 (not 5432)"
echo "  - Added: ?pgbouncer=true parameter"
echo ""
echo "To add this to Vercel, run:"
echo "  vercel env add DATABASE_URL production"
echo ""
echo "Then paste the connection string above when prompted."
echo ""
