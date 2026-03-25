# 🎯 PROMOTIONS & CAMPAIGNS SYSTEM

## Vision: Drive Sales Through Creative Campaigns

### Use Cases:

**1. Weekend Group Pack Promo:**
- "Buy 4 drink vouchers → Enter raffle for free VIP tickets"
- "Book table for 6+ → Get free bottle upgrade"
- "Early bird tickets → Chance to win meet & greet"

**2. Flash Sales:**
- "Next 50 buyers get 30% off"
- "Happy hour pricing (6-8pm only)"
- "Last 10 tickets → Final call discount"

**3. Referral Campaigns:**
- "Bring 3 friends → Your ticket is free"
- "Share event → Unlock discount code"
- "First 20 referrals get backstage pass"

**4. Cross-Promotions:**
- "Buy event ticket → Get bar discount code"
- "Attend 3 events this month → Free brunch"
- "VIP members → Early access to all events"

**5. Loyalty Rewards:**
- "Spend UGX 100K → Gold tier → 20% off forever"
- "10 events attended → Free +1 ticket"
- "Birthday month → 50% off any event"

---

## Campaign Types:

### **A. Raffle/Giveaway**
- Buy X → Get entry
- Multiple entries allowed
- Random winner selection
- Auto-announce winner

**Example:**
```
🎟️ Weekend Special!
Buy group pack (4 drink vouchers) → Get raffle entry
Prize: 2 VIP tickets to Sukali Live Concert
Draw: Sunday 8PM
Current entries: 156
```

### **B. Discount Codes**
- Unique codes (WEEKEND20)
- Time-limited
- Usage limits
- Stackable/non-stackable

**Example:**
```
⚡ Flash Sale!
Code: EARLYBIRD
Discount: 30% off
Valid: Next 2 hours only
Remaining uses: 43/100
```

### **C. Bundle Deals**
- Multiple items together
- Group pricing
- Package deals

**Example:**
```
🍾 VIP Experience Pack
- VIP table for 6
- 2 bottles premium
- Reserved parking
Save 25% vs buying separately
UGX 500K (was 650K)
```

### **D. Conditional Offers**
- If/then logic
- Triggers automatic

**Example:**
```
📢 Bring Your Crew!
Book for 6+ people → Get:
- Free bottle upgrade
- Priority entry
- Group photo session
```

---

## Admin Interface (Promoter Dashboard):

### **Create Campaign Flow:**

**Step 1: Campaign Type**
- [ ] Raffle/Giveaway
- [ ] Discount Code
- [ ] Bundle Deal
- [ ] Conditional Offer
- [ ] Flash Sale

**Step 2: Campaign Details**
- Name: "Weekend Drink Pack Raffle"
- Description: "Buy group drinks, win VIP tickets"
- Start date/time
- End date/time
- Prize/Reward

**Step 3: Entry Requirements**
- Minimum purchase: UGX 50,000
- Required items: Group drink pack
- Entry limit per user: 5 max
- Auto-entry or manual claim

**Step 4: Prize Setup**
- Prize: 2 VIP tickets to [Event Name]
- Number of winners: 1
- Runner-up prizes: 5 drink vouchers (optional)
- Draw method: Random / First-come / Highest spender

**Step 5: Promotion**
- Auto-post to social media
- Send to all followers
- Banner on event page
- WhatsApp blast

**Step 6: Launch**
- Review campaign
- Activate now or schedule
- Track entries in real-time

---

## User Experience:

### **Attendee Sees Campaign:**

**On Event Page:**
```
┌─────────────────────────────────┐
│ 🎁 ACTIVE PROMOTION             │
│ Weekend Group Pack Raffle       │
│                                 │
│ Buy 4 drink vouchers →          │
│ Win 2 VIP tickets!              │
│                                 │
│ Entries so far: 87              │
│ Draw in: 2 days 5 hours         │
│                                 │
│ [Enter Now] [See Details]       │
└─────────────────────────────────┘
```

**Purchase Flow:**
1. User adds group drink pack to cart
2. Sees: "✨ You're entered in the raffle!"
3. Gets entry confirmation on WhatsApp
4. Can track entries in wallet/profile

**Winner Announcement:**
- Auto-WhatsApp notification
- Email notification
- Public announcement on event page
- Social media post (with permission)

---

## Database Schema:

```sql
-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  organizer_id UUID REFERENCES users(id),
  
  -- Campaign details
  name TEXT NOT NULL,
  description TEXT,
  type TEXT, -- raffle, discount, bundle, conditional
  
  -- Timing
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Requirements
  min_purchase DECIMAL,
  required_items JSONB, -- [{type: 'drink_pack', quantity: 4}]
  entry_limit_per_user INTEGER,
  
  -- Prize/Reward
  prize_type TEXT, -- tickets, discount, physical, voucher
  prize_details JSONB,
  winner_count INTEGER DEFAULT 1,
  
  -- Status
  status TEXT, -- draft, active, ended, announced
  total_entries INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign entries
CREATE TABLE campaign_entries (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  user_id UUID REFERENCES users(id),
  
  -- Entry details
  transaction_id UUID REFERENCES transactions(id),
  entry_count INTEGER DEFAULT 1, -- multiple entries possible
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Winner tracking
  is_winner BOOLEAN DEFAULT FALSE,
  prize_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ
);

-- Discount codes
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT, -- percentage, fixed_amount
  discount_value DECIMAL,
  
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  
  min_purchase DECIMAL,
  applicable_items JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Features:

### **For Promoters:**

✅ **Easy Creation**
- Wizard-style campaign builder
- Templates (raffle, flash sale, referral)
- Preview before launching

✅ **Real-time Tracking**
- Entry counter
- Revenue from campaign
- Conversion rate
- Most popular prizes

✅ **Automation**
- Auto-entry when purchase made
- Auto-winner selection
- Auto-notifications
- Auto-social posts

✅ **Analytics**
- Campaign ROI
- Engagement rate
- Viral coefficient
- Revenue lift

### **For Attendees:**

✅ **Transparency**
- See total entries
- Know odds of winning
- Track your entries
- Get instant confirmation

✅ **Gamification**
- Multiple entries = better odds
- Leaderboards (optional)
- Share to unlock bonuses
- Streak rewards

✅ **Fair & Verified**
- Random selection algorithm
- Public winner announcement
- Proof of fairness
- Runner-up prizes

---

## Revenue Model:

**Platform Takes:**
- 5% of campaign-driven revenue
- Or flat fee per campaign (UGX 10,000)
- Premium features (advanced analytics)

**Promoter Benefits:**
- Increased sales (avg 40% lift)
- Higher engagement
- Viral sharing
- Customer loyalty

---

## Phase 1 (Week 2): Basic Raffles
- Create raffle campaign
- Auto-entry on purchase
- Random winner selection
- Winner notifications

## Phase 2 (Week 3): Discount Codes
- Generate unique codes
- Time/usage limits
- Redemption tracking

## Phase 3 (Week 4): Advanced
- Bundle deals
- Conditional offers
- Cross-event campaigns
- Loyalty programs

---

**This turns events into revenue-generating machines!** 🚀
