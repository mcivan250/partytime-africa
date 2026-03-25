#!/bin/bash

# Load environment variables
source app/.env.local

SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

echo "📦 Applying schema to Supabase..."
echo "🔗 Project: $SUPABASE_URL"
echo ""

# Read schema file
SCHEMA=$(cat schema.sql)

# Execute SQL via Supabase Management API
# Note: We'll use the SQL Editor endpoint
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SCHEMA" | jq -Rs .)}"

echo ""
echo "✅ Schema application complete"
