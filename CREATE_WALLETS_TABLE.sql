-- Create wallets table for user accounts
-- This is CRITICAL for account creation to work

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    balance_cents INTEGER DEFAULT 0 CHECK (balance_cents >= 0),
    currency TEXT DEFAULT 'UGX',
    pin_hash TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    failed_pin_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    verification_tier INTEGER DEFAULT 1 CHECK (verification_tier IN (1, 2, 3)),
    daily_limit_cents INTEGER DEFAULT 200000, -- UGX 200K default for Tier 1
    single_transaction_limit_cents INTEGER DEFAULT 50000, -- UGX 50K per transaction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own wallet
CREATE POLICY "Users can view their own wallet"
    ON wallets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
    ON wallets FOR UPDATE
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON wallets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_wallets_updated_at();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Wallets table created successfully!';
END $$;
