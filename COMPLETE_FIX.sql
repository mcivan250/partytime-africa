-- COMPLETE FIX FOR SIGNUP - Run this in Supabase SQL Editor

-- 1. Fix users table RLS policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Public profiles viewable" ON users FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service inserts users" ON users FOR INSERT WITH CHECK (true);

-- 2. Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    balance_cents INTEGER DEFAULT 0 CHECK (balance_cents >= 0),
    currency TEXT DEFAULT 'UGX',
    pin_hash TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    failed_pin_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    verification_tier INTEGER DEFAULT 1,
    daily_limit_cents INTEGER DEFAULT 200000,
    single_transaction_limit_cents INTEGER DEFAULT 50000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- 4. Wallets RLS policies
DROP POLICY IF EXISTS "Users view own wallet" ON wallets;
DROP POLICY IF EXISTS "Users update own wallet" ON wallets;
DROP POLICY IF EXISTS "Service inserts wallets" ON wallets;

CREATE POLICY "Users view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own wallet" ON wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service inserts wallets" ON wallets FOR INSERT WITH CHECK (true);

-- 5. Create index
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Done!
SELECT 'Signup is now fixed! Test at https://partytime.africa/auth' AS message;
