#!/usr/bin/env python3
import os
import psycopg2
from urllib.parse import urlparse

# Parse Supabase credentials from .env.local
with open('app/.env.local') as f:
    env = dict(line.strip().split('=', 1) for line in f if '=' in line)

supabase_url = env['NEXT_PUBLIC_SUPABASE_URL']
project_ref = supabase_url.replace('https://', '').split('.')[0]

# Supabase connection string format
# You'll need the DB password from your Supabase project settings
# For now, let's print instructions

print("🎯 To apply the schema to Supabase:")
print(f"\n1. Go to: https://supabase.com/dashboard/project/{project_ref}/sql/new")
print("\n2. Copy the entire contents of schema.sql")
print("\n3. Paste into the SQL editor and click 'Run'")
print("\n✅ This will create all 7 tables with RLS policies and indexes")
print("\n" + "="*60)
print("\nOr, if you have the DB password, run:")
print(f"  psql 'postgresql://postgres:[YOUR-PASSWORD]@db.{project_ref}.supabase.co:5432/postgres' -f schema.sql")
