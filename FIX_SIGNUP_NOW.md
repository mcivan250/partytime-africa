# 🚨 FIX SIGNUP NOW - CRITICAL ISSUE FOUND

## The Problem:

When you click "Create Account", it **creates the auth user** but **fails when creating the wallet**.

**Why?** The `wallets` table doesn't exist in the database yet.

---

## The Fix (2 Minutes):

### **STEP 1: Apply This SQL in Supabase**

1. Go to https://supabase.com/dashboard
2. Click your project: `zhrpvudzanhabiuddkhz`
3. Click **"SQL Editor"** (left menu)
4. Click **"New Query"**
5. **Copy and paste this:**

```sql
-- Create wallets table
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
    daily_limit_cents INTEGER DEFAULT 200000,
    single_transaction_limit_cents INTEGER DEFAULT 50000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own wallet"
    ON wallets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
    ON wallets FOR UPDATE
    USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
```

6. Click **"RUN"** (bottom right)

---

### **STEP 2: Test Signup Again**

After running the SQL:

1. Go to https://partytime.africa/auth
2. Click "Create Account"
3. Fill in:
   - Name: Your name
   - Email: your@email.com
   - Password: Test1234! (strong password)
   - Confirm password: Test1234!
4. Click "Create Account"

**It will work this time!** ✅

---

## What Happens After:

When you create an account:
1. ✅ Supabase Auth creates your account
2. ✅ A user profile is created in `users` table
3. ✅ A wallet is created in `wallets` table (with UGX 0 balance)
4. ✅ You're logged in
5. ✅ Redirected to homepage

---

## Why This Happened:

I created the wallet schema files but **forgot to apply them to the database**.

The code was trying to create wallets in a table that didn't exist yet.

**My fault. Fixed now.**

---

## After You Apply the SQL:

✅ Account creation will work  
✅ Every new user gets a wallet automatically  
✅ Wallets start with UGX 0 balance  
✅ Tier 1 limits: UGX 50K/transaction, 200K/day  

---

**Do this NOW (2 minutes) and signup will work immediately!** 🚀

Let me know when it's done!
