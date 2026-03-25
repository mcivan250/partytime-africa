# Party Time Africa — Payment System Specification

## 🎯 Core Vision

**"Turn up now, pay later"** — Let guests secure their spot with installments.

## 🏦 Wallet System

### User Wallet Features

1. **Party Time Wallet**
   - Each user gets a wallet on signup
   - Balance displayed in dashboard
   - Transaction history
   - Withdraw to Mobile Money
   - Top up via MTN/Airtel/M-Pesa

2. **Wallet Balance Uses**
   - Pay for event tickets
   - Receive refunds
   - Get paid (for organizers)
   - Send/receive between users

3. **Security**
   - PIN for transactions over $5
   - 2FA for withdrawals
   - Transaction limits (daily/weekly)
   - Fraud detection
   - Encrypted wallet keys

## 💳 Payment Methods

### 1. Mobile Money (Primary)
- **Uganda:** MTN Mobile Money, Airtel Money
- **Kenya:** M-Pesa
- **Nigeria:** Flutterwave integration
- **Ghana:** MTN, Vodafone Cash

### 2. Card Payments (Secondary)
- Visa/Mastercard via Flutterwave
- For international guests

### 3. Wallet Balance (Instant)
- Pay from Party Time wallet
- No fees for wallet transactions

## 📅 Installment Plans

### How It Works

**Example: Event ticket costs $20**

**Option 1: Pay in Full**
- $20 now
- Ticket confirmed instantly

**Option 2: 2 Payments**
- $10 now (50% down payment)
- $10 due 3 days before event
- Ticket confirmed after first payment

**Option 3: 3 Payments**
- $7 now (35% down payment)
- $7 in 1 week
- $6 final payment 3 days before event

**Option 4: Weekly Until Event**
- Flexible: Pay $5/week until event
- Must complete 3 days before
- Auto-reminder via WhatsApp

### Organizer Controls

Host can set:
- ✅ Enable/disable installments
- ✅ Minimum down payment % (default 35%)
- ✅ Payment deadline (default 3 days before)
- ✅ Late fee for missed payments (optional)
- ✅ Auto-cancellation after missed payment

### Payment Reminders

- SMS/WhatsApp 7 days before due
- WhatsApp 3 days before due
- WhatsApp 1 day before due
- Final reminder morning of due date

### Failed Payment Handling

1. Grace period: 24 hours
2. Auto-retry payment (if saved method)
3. Cancel ticket if still unpaid
4. Refund policy based on organizer settings

## 💰 Organizer Payouts

### Payout Options

1. **Instant Wallet Transfer**
   - Money goes to organizer's wallet
   - Can withdraw anytime
   - No fees

2. **Mobile Money Payout**
   - Batch payouts daily at 6pm
   - Minimum: $10
   - Fee: 1.5%

3. **Hold Until Event**
   - Money held in escrow
   - Released 24h after event
   - Protection against fraud

### Revenue Split

**Free Events:** 
- 100% free forever
- No hidden fees

**Paid Events:**
- **Platform fee:** 3% + $0.30 per ticket
- **Payment processing:** 1.5% (Mobile Money) or 3% (Card)
- **Total cost:** ~4.5% + $0.30

**Volume Discount:**
- 100+ tickets/month: 2% platform fee
- 500+ tickets/month: 1% platform fee

## 🔐 Security Features

### Fraud Prevention

1. **Email/Phone Verification**
   - Required before first payment
   - SMS OTP for new devices

2. **Velocity Checks**
   - Max 3 transactions per hour
   - Max $200 per day (new users)
   - Max $1000 per day (verified users)

3. **Device Fingerprinting**
   - Track suspicious patterns
   - Block repeated failed payments

4. **Chargeback Protection**
   - Clear refund policy
   - Event proof (photos, check-in data)
   - Organizer insurance fund

### Wallet Security

1. **PIN Protection**
   - 6-digit PIN required
   - 3 failed attempts = 1 hour lockout
   - Can reset via SMS

2. **Transaction Limits**
   - Tier 1 (new): $50/day
   - Tier 2 (verified ID): $500/day
   - Tier 3 (business): $5000/day

3. **Withdrawal Verification**
   - Withdraw to verified numbers only
   - SMS OTP for every withdrawal
   - 24h pending for first withdrawal

4. **Audit Trail**
   - Every transaction logged
   - IP address, device, timestamp
   - Export statement anytime

## 📊 Database Schema (New Tables)

```sql
-- Wallets
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    balance_cents INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    pin_hash TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    verification_tier INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id),
    type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'payment', 'refund', 'transfer'
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket Purchases
CREATE TABLE ticket_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id),
    user_id UUID REFERENCES users(id),
    ticket_type TEXT, -- 'regular', 'vip', 'early_bird'
    price_cents INTEGER NOT NULL,
    payment_plan TEXT DEFAULT 'full', -- 'full', 'installment_2', 'installment_3', 'weekly'
    amount_paid_cents INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'refunded'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Installment Schedules
CREATE TABLE installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_purchase_id UUID REFERENCES ticket_purchases(id),
    installment_number INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payouts
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id),
    organizer_wallet_id UUID REFERENCES wallets(id),
    amount_cents INTEGER NOT NULL,
    platform_fee_cents INTEGER NOT NULL,
    processing_fee_cents INTEGER NOT NULL,
    net_amount_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    payout_method TEXT, -- 'wallet', 'mobile_money', 'bank'
    payout_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

## 🎨 UX Flow

### For Guests

1. **Browse Event**
   - See ticket price
   - See payment options
   - See installment calculator

2. **Choose Payment Plan**
   - Full payment (instant confirmation)
   - 2 payments (50% now)
   - 3 payments (35% now)
   - Weekly (flexible)

3. **Make Payment**
   - Choose: Wallet, Mobile Money, or Card
   - Enter PIN (if wallet)
   - Get confirmation + receipt

4. **Track Payments**
   - Dashboard shows upcoming installments
   - WhatsApp reminders before due
   - Pay early to clear balance

### For Organizers

1. **Set Ticket Price**
   - Regular: $20
   - VIP: $50
   - Early Bird: $15

2. **Configure Payments**
   - Enable/disable installments
   - Set minimum down payment
   - Set payment deadline
   - Choose payout timing

3. **Monitor Sales**
   - Real-time dashboard
   - Tickets sold vs pending payments
   - Revenue projections
   - Payment success rate

4. **Get Paid**
   - Auto-payout to wallet
   - Withdraw to Mobile Money
   - Or wait until after event

## 🚀 MVP Priorities (Week 1)

**Phase 1: Basic Paid Events**
- Event tickets with fixed price
- Full payment only (no installments yet)
- Wallet system (balance + top-up)
- Mobile Money integration (MTN/Airtel Uganda)

**Phase 2: Installments**
- 2-payment plan (50% down)
- Payment reminders via WhatsApp
- Auto-cancellation for non-payment

**Phase 3: Advanced**
- 3+ payment plans
- Weekly flexible payments
- Organizer payout automation
- Fraud detection

## 💡 Competitive Advantages

1. **Installments = More Sales**
   - Lower barrier to entry
   - Guests more likely to commit
   - Higher ticket values possible

2. **Mobile Money First**
   - Where Africa's money actually is
   - Lower fees than cards
   - Instant settlement

3. **Wallet System**
   - Reduces transaction fees
   - Builds loyalty
   - Enables peer-to-peer transfers

4. **WhatsApp Native**
   - Reminders where users live
   - Easy sharing
   - Status updates

## 🎯 Revenue Model

**Transaction Revenue:**
- 4.5% of every paid ticket
- Target: 10,000 tickets/month = $9,000/month
- Year 1 goal: $100,000 in transaction fees

**Premium Features (Future):**
- Custom branding: $20/month
- Advanced analytics: $50/month
- Priority support: $100/month
- White-label: $500/month

---

**This is not just a Partiful clone. This is the African event platform.**
