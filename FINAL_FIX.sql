-- FINAL FIX - Complete wallets table with all columns

-- Drop and recreate wallets table with ALL columns
DROP TABLE IF EXISTS wallets CASCADE;

CREATE TABLE wallets (
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
    pin_set_at TIMESTAMP WITH TIME ZONE,
    pin_changed_at TIMESTAMP WITH TIME ZONE,
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    daily_transaction_count INTEGER DEFAULT 0,
    daily_transaction_sum_cents INTEGER DEFAULT 0,
    daily_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own wallet" 
    ON wallets FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users update own wallet" 
    ON wallets FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow wallet creation" 
    ON wallets FOR INSERT 
    WITH CHECK (true);

-- Index
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Success message
SELECT 'Wallets table created with all columns!' AS result;
