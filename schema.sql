-- Party Time Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT UNIQUE,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID REFERENCES users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier (e.g., /e/birthday-bash-xyz)
    title TEXT NOT NULL,
    description TEXT,
    date_time TIMESTAMP WITH TIME ZONE,
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    
    -- Customization
    theme TEXT DEFAULT 'sunset', -- sunset, galaxy, watercolor, etc.
    poster_template TEXT,
    font_style TEXT DEFAULT 'display',
    animation_effect TEXT DEFAULT 'none', -- confetti, sunbeams, bows, etc.
    
    -- Settings
    max_capacity INTEGER,
    is_guest_list_public BOOLEAN DEFAULT TRUE,
    is_comments_enabled BOOLEAN DEFAULT TRUE,
    rsvp_deadline TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RSVPs table
CREATE TABLE rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'cant_go')),
    plus_ones INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event questions (polls/forms)
CREATE TABLE event_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'text', -- text, multiple_choice, yes_no
    options JSONB, -- for multiple choice questions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event answers
CREATE TABLE event_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES event_questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    answer_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_events_host_id ON events(host_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX idx_rsvps_user_id ON rsvps(user_id);
CREATE INDEX idx_comments_event_id ON comments(event_id);
CREATE INDEX idx_photos_event_id ON photos(event_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Can read all, update own
CREATE POLICY "Public profiles are viewable by everyone" 
    ON users FOR SELECT 
    USING (true);

CREATE POLICY "Users can update own profile" 
    ON users FOR UPDATE 
    USING (auth.uid() = id);

-- Events: Public read, host can modify
CREATE POLICY "Events are viewable by everyone" 
    ON events FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can create events" 
    ON events FOR INSERT 
    WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their events" 
    ON events FOR UPDATE 
    USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their events" 
    ON events FOR DELETE 
    USING (auth.uid() = host_id);

-- RSVPs: Public read (if event allows), authenticated can RSVP
CREATE POLICY "RSVPs are viewable if guest list is public" 
    ON rsvps FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = rsvps.event_id 
            AND events.is_guest_list_public = true
        )
    );

CREATE POLICY "Authenticated users can RSVP" 
    ON rsvps FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVP" 
    ON rsvps FOR UPDATE 
    USING (auth.uid() = user_id);

-- Comments: Public read (if enabled), authenticated can comment
CREATE POLICY "Comments are viewable if enabled" 
    ON comments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = comments.event_id 
            AND events.is_comments_enabled = true
        )
    );

CREATE POLICY "Authenticated users can comment" 
    ON comments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
    ON comments FOR DELETE 
    USING (auth.uid() = user_id);

-- Photos: Public read, authenticated can upload
CREATE POLICY "Photos are viewable by everyone" 
    ON photos FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can upload photos" 
    ON photos FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance BIGINT DEFAULT 0, -- Balance in UGX (smallest unit)
    currency TEXT DEFAULT 'UGX',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('payment', 'earning', 'deposit', 'withdrawal')),
    amount BIGINT NOT NULL, -- Amount in UGX
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
    description TEXT,
    reference_id TEXT, -- Flutterwave transaction ID
    metadata JSONB, -- Additional data (event_id, ticket_tier, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('early_bird', 'regular', 'vip')),
    quantity INTEGER NOT NULL DEFAULT 1,
    price_per_ticket BIGINT NOT NULL, -- Price in UGX
    total_price BIGINT NOT NULL, -- Total price in UGX
    transaction_id UUID REFERENCES transactions(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment requests table (for Flutterwave integration)
CREATE TABLE payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL, -- Amount in UGX
    currency TEXT DEFAULT 'UGX',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    flutterwave_link TEXT, -- Payment link from Flutterwave
    flutterwave_tx_ref TEXT, -- Flutterwave transaction reference
    metadata JSONB, -- Additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate commissions table
CREATE TABLE affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    commission_amount BIGINT NOT NULL, -- Commission in UGX
    commission_rate DECIMAL(5, 2) DEFAULT 10.0, -- Percentage
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_affiliate_commissions_referrer_id ON affiliate_commissions(referrer_id);
CREATE INDEX idx_affiliate_commissions_status ON affiliate_commissions(status);

-- Enable Row Level Security
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Wallets
CREATE POLICY "Users can view own wallet" 
    ON wallets FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "System can update wallet balance" 
    ON wallets FOR UPDATE 
    USING (true);

-- RLS Policies for Transactions
CREATE POLICY "Users can view own transactions" 
    ON transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" 
    ON transactions FOR INSERT 
    WITH CHECK (true);

-- RLS Policies for Tickets
CREATE POLICY "Users can view own tickets" 
    ON tickets FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Event hosts can view all tickets for their events" 
    ON tickets FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = tickets.event_id 
            AND events.host_id = auth.uid()
        )
    );

-- RLS Policies for Payment Requests
CREATE POLICY "Users can view own payment requests" 
    ON payment_requests FOR SELECT 
    USING (auth.uid() = user_id);

-- RLS Policies for Affiliate Commissions
CREATE POLICY "Users can view own commissions" 
    ON affiliate_commissions FOR SELECT 
    USING (auth.uid() = referrer_id);

-- Triggers for updated_at
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON payment_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_commissions_updated_at BEFORE UPDATE ON affiliate_commissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
