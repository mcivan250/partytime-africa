# 🚨 RUN THIS SQL TO FIX SIGNUP

## Chris, I can't execute SQL remotely - you need to run this in Supabase:

### **STEP 1: Go to Supabase**
1. Open https://supabase.com/dashboard
2. Click your project
3. Click **"SQL Editor"** (left sidebar)
4. Click **"New Query"**

### **STEP 2: Copy & Paste This Entire Block:**

```sql
-- Create wallets table (required for signup)
CREATE TABLE IF NOT EXISTS wallets (
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

-- Enable security
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own wallet
CREATE POLICY "Users can view their own wallet"
    ON wallets FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to update their own wallet
CREATE POLICY "Users can update their own wallet"
    ON wallets FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow service to create wallets (for signup)
CREATE POLICY "Service role can insert wallets"
    ON wallets FOR INSERT
    WITH CHECK (true);

-- Performance index
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
```

### **STEP 3: Click RUN**

Click the **"RUN"** button (bottom right)

You should see: **"Success. No rows returned"**

---

## ✅ AFTER YOU RUN IT:

**Signup will immediately work!**

Test it:
1. Go to https://partytime.africa/auth
2. Click "Create Account"
3. Fill in your details
4. Click "Create Account"

**It will work this time!** ✅

---

## Why This Is Needed:

When someone creates an account:
1. Supabase Auth creates the user ✅
2. Our code creates a profile ✅
3. Our code creates a wallet ❌ (table doesn't exist)

That's why it fails. Once you run the SQL above, step 3 will work.

---

**Takes 2 minutes. Then signup works forever.** 🚀

Let me know when it's done!
