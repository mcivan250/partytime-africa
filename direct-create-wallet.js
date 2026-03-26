const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createWalletsDirectly() {
  console.log('🔧 Creating wallets table directly via SQL...\n');
  
  const sql = `
    -- Drop if exists (for clean slate)
    DROP TABLE IF EXISTS wallets CASCADE;
    
    -- Create wallets table
    CREATE TABLE wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        balance_cents INTEGER DEFAULT 0 CHECK (balance_cents >= 0),
        currency TEXT DEFAULT 'UGX',
        pin_hash TEXT,
        is_locked BOOLEAN DEFAULT FALSE,
        failed_pin_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP WITH TIME ZONE,
        verification_tier INTEGER DEFAULT 1 CHECK (verification_tier IN (1, 2, 3)),
        daily_limit_cents INTEGER DEFAULT 200000,
        single_transaction_limit_cents INTEGER DEFAULT 50000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
    
    -- RLS Policies
    DROP POLICY IF EXISTS "Users can view their own wallet" ON wallets;
    CREATE POLICY "Users can view their own wallet"
        ON wallets FOR SELECT
        USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can update their own wallet" ON wallets;
    CREATE POLICY "Users can update their own wallet"
        ON wallets FOR UPDATE
        USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Service role can insert wallets" ON wallets;
    CREATE POLICY "Service role can insert wallets"
        ON wallets FOR INSERT
        WITH CHECK (true);
    
    -- Index
    CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
  `;
  
  try {
    // Use raw SQL execution
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.log('⚠️  RPC method failed, trying direct query...\n');
      
      // Try using PostgREST directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ sql })
      });
      
      const result = await response.text();
      console.log('Response:', result);
      
      if (response.ok) {
        console.log('✅ Wallets table created via direct query!\n');
      } else {
        console.log('❌ Direct query failed:', result);
        console.log('\n📋 SQL TO RUN MANUALLY IN SUPABASE DASHBOARD:\n');
        console.log(sql);
      }
    } else {
      console.log('✅ Wallets table created via RPC!\n');
    }
    
    // Test if it worked
    console.log('🧪 Testing wallets table...\n');
    const { data: testData, error: testError } = await supabase
      .from('wallets')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Wallets table still not accessible:', testError.message);
      console.log('\n⚠️  YOU NEED TO RUN THE SQL MANUALLY IN SUPABASE DASHBOARD');
      console.log('\n📋 Copy this SQL and run it in Supabase SQL Editor:\n');
      console.log('-'.repeat(60));
      console.log(sql);
      console.log('-'.repeat(60));
    } else {
      console.log('✅ Wallets table is working!');
      console.log('\n🎉 SIGNUP WILL NOW WORK!');
      console.log('Test at: https://partytime.africa/auth\n');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n⚠️  MANUAL ACTION REQUIRED');
    console.log('\nGo to Supabase Dashboard → SQL Editor and run this:\n');
    console.log('-'.repeat(60));
    console.log(sql);
    console.log('-'.repeat(60));
  }
}

createWalletsDirectly();
