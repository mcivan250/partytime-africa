-- Payment System Schema for Party Time Africa

-- Wallets
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    balance_cents INTEGER DEFAULT 0 CHECK (balance_cents >= 0),
    currency TEXT DEFAULT 'USD',
    pin_hash TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    failed_pin_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    verification_tier INTEGER DEFAULT 1 CHECK (verification_tier IN (1, 2, 3)),
    daily_limit_cents INTEGER DEFAULT 5000, -- $50 default
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id),
    related_wallet_id UUID REFERENCES wallets(id), -- for transfers
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund', 'transfer_in', 'transfer_out', 'payout')),
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Ticket Types
CREATE TABLE ticket_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'Regular', 'VIP', 'Early Bird'
    description TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    quantity_available INTEGER,
    quantity_sold INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket Purchases
CREATE TABLE ticket_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES ticket_types(id),
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL,
    total_price_cents INTEGER NOT NULL,
    payment_plan TEXT DEFAULT 'full' CHECK (payment_plan IN ('full', 'installment_2', 'installment_3', 'weekly')),
    amount_paid_cents INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'payment_plan', 'cancelled', 'refunded')),
    confirmation_code TEXT UNIQUE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Installment Schedules
CREATE TABLE installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_purchase_id UUID REFERENCES ticket_purchases(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    payment_transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ticket_purchase_id, installment_number)
);

-- Payment Methods (stored payment options)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('mobile_money', 'card')),
    provider TEXT, -- 'mtn', 'airtel', 'mpesa', 'visa', 'mastercard'
    last_four TEXT,
    phone_number TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payouts to Organizers
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    organizer_wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    gross_amount_cents INTEGER NOT NULL,
    platform_fee_cents INTEGER NOT NULL,
    processing_fee_cents INTEGER NOT NULL,
    net_amount_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payout_method TEXT CHECK (payout_method IN ('wallet', 'mobile_money', 'bank')),
    payout_details JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Payment Settings per Event
CREATE TABLE event_payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE,
    is_paid_event BOOLEAN DEFAULT FALSE,
    accept_installments BOOLEAN DEFAULT TRUE,
    min_down_payment_percent INTEGER DEFAULT 35 CHECK (min_down_payment_percent BETWEEN 0 AND 100),
    payment_deadline_hours INTEGER DEFAULT 72, -- 3 days before event
    late_fee_cents INTEGER DEFAULT 0,
    auto_cancel_unpaid BOOLEAN DEFAULT TRUE,
    payout_timing TEXT DEFAULT 'instant' CHECK (payout_timing IN ('instant', 'after_event', 'scheduled')),
    payout_schedule_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_ticket_purchases_event_id ON ticket_purchases(event_id);
CREATE INDEX idx_ticket_purchases_user_id ON ticket_purchases(user_id);
CREATE INDEX idx_ticket_purchases_status ON ticket_purchases(status);
CREATE INDEX idx_installments_ticket_purchase_id ON installments(ticket_purchase_id);
CREATE INDEX idx_installments_due_date ON installments(due_date);
CREATE INDEX idx_installments_status ON installments(status);
CREATE INDEX idx_payouts_event_id ON payouts(event_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- Enable Row Level Security
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_payment_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Wallets
CREATE POLICY "Users can view own wallet"
    ON wallets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet PIN"
    ON wallets FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies: Transactions
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (
        wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
        OR related_wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
    );

-- RLS Policies: Ticket Types
CREATE POLICY "Anyone can view active ticket types"
    ON ticket_types FOR SELECT
    USING (is_active = true);

CREATE POLICY "Event hosts can manage ticket types"
    ON ticket_types FOR ALL
    USING (
        event_id IN (SELECT id FROM events WHERE host_id = auth.uid())
    );

-- RLS Policies: Ticket Purchases
CREATE POLICY "Users can view own purchases"
    ON ticket_purchases FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Event hosts can view event purchases"
    ON ticket_purchases FOR SELECT
    USING (
        event_id IN (SELECT id FROM events WHERE host_id = auth.uid())
    );

CREATE POLICY "Users can create purchases"
    ON ticket_purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies: Installments
CREATE POLICY "Users can view own installments"
    ON installments FOR SELECT
    USING (
        ticket_purchase_id IN (SELECT id FROM ticket_purchases WHERE user_id = auth.uid())
    );

-- RLS Policies: Payment Methods
CREATE POLICY "Users can manage own payment methods"
    ON payment_methods FOR ALL
    USING (auth.uid() = user_id);

-- RLS Policies: Payouts
CREATE POLICY "Organizers can view own payouts"
    ON payouts FOR SELECT
    USING (
        organizer_wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
    );

-- RLS Policies: Event Payment Settings
CREATE POLICY "Anyone can view event payment settings"
    ON event_payment_settings FOR SELECT
    USING (true);

CREATE POLICY "Event hosts can manage payment settings"
    ON event_payment_settings FOR ALL
    USING (
        event_id IN (SELECT id FROM events WHERE host_id = auth.uid())
    );

-- Triggers for updated_at
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_purchases_updated_at BEFORE UPDATE ON ticket_purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_payment_settings_updated_at BEFORE UPDATE ON event_payment_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate confirmation code
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate confirmation code on ticket purchase
CREATE OR REPLACE FUNCTION set_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.confirmation_code IS NULL THEN
        NEW.confirmation_code := generate_confirmation_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_purchase_confirmation_code
    BEFORE INSERT ON ticket_purchases
    FOR EACH ROW
    EXECUTE FUNCTION set_confirmation_code();
