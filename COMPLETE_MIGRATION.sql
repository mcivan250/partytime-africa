-- ============================================================
-- COMPLETE PARTYTIME AFRICA DATABASE MIGRATION
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate confirmation code
CREATE OR REPLACE FUNCTION set_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.confirmation_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- VENUES & TABLE BOOKING SCHEMA
-- ============================================================

-- Venues (for bars/restaurants)
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    phone_number TEXT,
    email TEXT,
    logo_url TEXT,
    cover_photo_url TEXT,
    venue_type TEXT CHECK (venue_type IN ('bar', 'restaurant', 'lounge', 'club', 'rooftop', 'cafe')),
    capacity INTEGER,
    amenities JSONB DEFAULT '[]',
    operating_hours JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venue Layouts (table arrangements)
CREATE TABLE IF NOT EXISTS venue_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    layout_name TEXT NOT NULL,
    layout_data JSONB NOT NULL, -- Contains table positions and configurations
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tables (physical tables at venues)
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    table_name TEXT,
    capacity INTEGER NOT NULL,
    min_capacity INTEGER,
    section TEXT,
    price_per_person_cents INTEGER,
    minimum_spend_cents INTEGER,
    deposit_required_cents INTEGER,
    features JSONB DEFAULT '[]',
    photos JSONB DEFAULT '[]',
    is_bookable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Bookings
CREATE TABLE IF NOT EXISTS table_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    time_slot_start TIME NOT NULL,
    time_slot_end TIME NOT NULL,
    party_size INTEGER NOT NULL,
    total_price_cents INTEGER NOT NULL,
    deposit_paid_cents INTEGER DEFAULT 0,
    minimum_spend_cents INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'fully_paid', 'refunded')),
    guest_name TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    guest_email TEXT,
    special_requests TEXT,
    occasion TEXT,
    confirmation_code TEXT UNIQUE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- EVENT MERCHANDISE SCHEMA
-- ============================================================

-- Merchandise Items
CREATE TABLE IF NOT EXISTS merchandise (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    sold_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    sizes JSONB DEFAULT '[]', -- ['S', 'M', 'L', 'XL']
    colors JSONB DEFAULT '[]', -- ['Black', 'White', 'Red']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchandise Orders
CREATE TABLE IF NOT EXISTS merchandise_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_price_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    shipping_address TEXT,
    tracking_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchandise Order Items
CREATE TABLE IF NOT EXISTS merchandise_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES merchandise_orders(id) ON DELETE CASCADE,
    merchandise_id UUID REFERENCES merchandise(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    size TEXT,
    color TEXT,
    price_cents INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PLAYLIST SCHEMA
-- ============================================================

-- Event Playlists
CREATE TABLE IF NOT EXISTS event_playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('spotify', 'youtube')),
    playlist_url TEXT NOT NULL,
    playlist_id TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS SCHEMA
-- ============================================================

-- Event Analytics
CREATE TABLE IF NOT EXISTS event_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    total_revenue_cents INTEGER DEFAULT 0,
    total_tickets_sold INTEGER DEFAULT 0,
    total_attendees INTEGER DEFAULT 0,
    check_in_rate DECIMAL(5, 2) DEFAULT 0,
    merchandise_revenue_cents INTEGER DEFAULT 0,
    average_ticket_price_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-In Records
CREATE TABLE IF NOT EXISTS check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    ticket_id UUID,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_in_method TEXT CHECK (check_in_method IN ('qr_code', 'manual', 'list'))
);

-- ============================================================
-- REFERRAL SCHEMA
-- ============================================================

-- Referral Profiles
CREATE TABLE IF NOT EXISTS referral_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    total_earnings_cents INTEGER DEFAULT 0,
    pending_earnings_cents INTEGER DEFAULT 0,
    commission_rate DECIMAL(5, 2) DEFAULT 10.0, -- 10% default
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral Transactions
CREATE TABLE IF NOT EXISTS referral_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES referral_profiles(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    ticket_price_cents INTEGER NOT NULL,
    commission_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS SCHEMA
-- ============================================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'event', 'message', 'promotion', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_venues_owner_id ON venues(owner_id);
CREATE INDEX IF NOT EXISTS idx_venues_venue_type ON venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venue_layouts_venue_id ON venue_layouts(venue_id);
CREATE INDEX IF NOT EXISTS idx_tables_venue_id ON tables(venue_id);
CREATE INDEX IF NOT EXISTS idx_table_bookings_venue_id ON table_bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_table_bookings_user_id ON table_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_table_bookings_date ON table_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_table_bookings_status ON table_bookings(status);
CREATE INDEX IF NOT EXISTS idx_merchandise_event_id ON merchandise(event_id);
CREATE INDEX IF NOT EXISTS idx_merchandise_orders_user_id ON merchandise_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_merchandise_orders_event_id ON merchandise_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_playlists_event_id ON event_playlists(event_id);
CREATE INDEX IF NOT EXISTS idx_event_analytics_event_id ON event_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_event_id ON check_ins(event_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_profiles_user_id ON referral_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer_id ON referral_transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Venues: Public can view, owners can manage
CREATE POLICY "Venues are publicly viewable" ON venues FOR SELECT USING (is_active = true);
CREATE POLICY "Venue owners can manage their venues" ON venues FOR ALL USING (auth.uid() = owner_id);

-- Venue Layouts: Public can view, owners can manage
CREATE POLICY "Venue layouts are publicly viewable" ON venue_layouts FOR SELECT USING (is_active = true);
CREATE POLICY "Venue owners can manage layouts" ON venue_layouts FOR ALL USING (
    venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
);

-- Tables: Public can view bookable tables
CREATE POLICY "Tables are publicly viewable" ON tables FOR SELECT USING (is_bookable = true);
CREATE POLICY "Venue owners can manage tables" ON tables FOR ALL USING (
    venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
);

-- Table Bookings: Users can view own, venues can view all for their venue
CREATE POLICY "Users can view own table bookings" ON table_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Venue owners can view their bookings" ON table_bookings FOR SELECT USING (
    venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can create table bookings" ON table_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Merchandise: Public can view, event organizers can manage
CREATE POLICY "Merchandise is publicly viewable" ON merchandise FOR SELECT USING (is_active = true);
CREATE POLICY "Event organizers can manage merchandise" ON merchandise FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE host_id = auth.uid())
);

-- Merchandise Orders: Users can view own, organizers can view for their events
CREATE POLICY "Users can view own merchandise orders" ON merchandise_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Event organizers can view orders for their events" ON merchandise_orders FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE host_id = auth.uid())
);
CREATE POLICY "Users can create merchandise orders" ON merchandise_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Event Playlists: Public can view
CREATE POLICY "Event playlists are publicly viewable" ON event_playlists FOR SELECT USING (true);
CREATE POLICY "Event organizers can manage playlists" ON event_playlists FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE host_id = auth.uid())
);

-- Event Analytics: Event organizers can view
CREATE POLICY "Event organizers can view analytics" ON event_analytics FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE host_id = auth.uid())
);

-- Check-Ins: Event organizers can manage
CREATE POLICY "Event organizers can view check-ins" ON check_ins FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE host_id = auth.uid())
);
CREATE POLICY "Event organizers can create check-ins" ON check_ins FOR INSERT WITH CHECK (
    event_id IN (SELECT id FROM events WHERE host_id = auth.uid())
);

-- Referral Profiles: Users can view own
CREATE POLICY "Users can view own referral profile" ON referral_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create referral profile" ON referral_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referral Transactions: Users can view own
CREATE POLICY "Users can view own referral transactions" ON referral_transactions FOR SELECT USING (
    referrer_id IN (SELECT id FROM referral_profiles WHERE user_id = auth.uid())
);

-- Notifications: Users can view own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_layouts_updated_at BEFORE UPDATE ON venue_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_bookings_updated_at BEFORE UPDATE ON table_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchandise_updated_at BEFORE UPDATE ON merchandise
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchandise_orders_updated_at BEFORE UPDATE ON merchandise_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_analytics_updated_at BEFORE UPDATE ON event_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_profiles_updated_at BEFORE UPDATE ON referral_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_transactions_updated_at BEFORE UPDATE ON referral_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER table_booking_confirmation_code BEFORE INSERT ON table_bookings
    FOR EACH ROW EXECUTE FUNCTION set_confirmation_code();

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- All tables have been created with proper RLS policies and indexes.
-- You can now use all the PartyTime Africa features!
