# 🔧 QUICK FIXES NEEDED (Chris - Do These Now)

## 🚨 CRITICAL: 3 Things to Fix in Supabase Dashboard

### 1. Apply Friends Table (2 minutes)

**Go to:** https://supabase.com/dashboard/project/zhrpvudzanhabiuddkhz/editor

**Click:** SQL Editor (left sidebar)

**Paste this:**
```sql
-- Friends/Connections Table
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'accepted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
    ON friends FOR SELECT
    USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);

CREATE POLICY "Users can create friendships"
    ON friends FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their friendships"
    ON friends FOR UPDATE
    USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);

CREATE POLICY "Users can delete their friendships"
    ON friends FOR DELETE
    USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);
```

**Click:** Run

---

### 2. Disable Email Rate Limiting (1 minute)

**Go to:** https://supabase.com/dashboard/project/zhrpvudzanhabiuddkhz/auth/rate-limits

**Find:** "Email signups per hour"

**Change:** From 10 (or whatever it is) → **1000**

**Save**

This fixes the "email rate limit" error people are getting when signing up.

---

### 3. Create Missing Wallet (2 minutes)

**Go to:** https://supabase.com/dashboard/project/zhrpvudzanhabiuddkhz/editor

**Click:** SQL Editor

**Paste this:**
```sql
-- Check which user is missing a wallet
SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE w.id IS NULL;

-- Create wallet for user: mcivan98@gmail.com
INSERT INTO wallets (user_id, balance_cents, currency, verification_tier, daily_limit_cents)
SELECT id, 0, 'UGX', 1, 500000
FROM users
WHERE email = 'mcivan98@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
```

**Click:** Run

---

## ✅ After These 3 Fixes:

1. ✅ Friends system will work
2. ✅ No more rate limit errors on signup
3. ✅ All users will have wallets

**Total time:** 5 minutes

---

## 🎉 THEN: Create 5 Test Events (15 minutes)

**Go to:** https://partytime.africa/create

**Create these events:**

### Event 1: Tattoos & Cocktails
- Title: "Tattoos & Cocktails Returns"
- Description: "The legendary night is back. Ink, drinks, and vibes."
- Date: Next Saturday at 8pm
- Location: Your usual venue
- Upload a poster image
- Theme: Fire or Ankara

### Event 2: Tall People Meetup
- Title: "Tall People Social Mixer"
- Description: "For everyone 6ft+ (183cm+). Finally meet people at eye level!"
- Date: This Sunday at 4pm
- Location: A rooftop venue
- Theme: Sunset or Royal

### Event 3: Rooftop Sunday Brunch
- Title: "Skyline Brunch & Beats"
- Description: "Bottomless mimosas, city views, Afrobeats playlist."
- Date: This Sunday at 11am
- Location: Any rooftop spot
- Theme: Ocean

### Event 4: Kampala Underground
- Title: "Underground Hip Hop Night"
- Description: "Local MCs, DJ battles, cipher at midnight."
- Date: Next Friday at 9pm
- Location: Urban venue
- Theme: Galaxy

### Event 5: African Fashion Showcase
- Title: "Ankara After Dark"
- Description: "Fashion show + networking. Dress code: Ankara only."
- Date: Next Thursday at 7pm
- Location: Design Hub or similar
- Theme: Ankara

---

## ✅ Result After All Fixes + Events:

- ✅ Homepage shows 5 events
- ✅ /events page has content
- ✅ People can sign up without rate limit
- ✅ Friends system works
- ✅ All users have wallets
- ✅ Platform looks ALIVE

**Platform grade goes from C+ to B+ instantly.**

---

**Chris: Do the 3 Supabase fixes (5 min), then create 5 events (15 min).**

**Total time: 20 minutes to transform the platform.**

🎯
