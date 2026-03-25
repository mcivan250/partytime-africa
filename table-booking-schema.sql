-- Table Booking & Brunch Events Schema

-- Venues (for bars/restaurants)
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
    amenities JSONB DEFAULT '[]', -- ['wifi', 'parking', 'live_music', 'outdoor_seating']
    operating_hours JSONB, -- {"monday": {"open": "10:00", "close": "22:00"}}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tables (physical tables at venues)
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    table_name TEXT, -- 'VIP Booth 1', 'Rooftop Corner Table'
    capacity INTEGER NOT NULL,
    min_capacity INTEGER, -- Minimum people required
    section TEXT, -- 'VIP', 'General', 'Rooftop', 'Indoor', 'Outdoor'
    price_per_person_cents INTEGER, -- For per-person pricing
    minimum_spend_cents INTEGER, -- Minimum spend to book
    deposit_required_cents INTEGER, -- Upfront deposit
    features JSONB DEFAULT '[]', -- ['window_view', 'near_stage', 'booth']
    photos JSONB DEFAULT '[]',
    is_bookable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Bookings
CREATE TABLE table_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    time_slot_start TIME NOT NULL,
    time_slot_end TIME NOT NULL,
    party_size INTEGER NOT NULL,
    
    -- Pricing
    total_price_cents INTEGER NOT NULL,
    deposit_paid_cents INTEGER DEFAULT 0,
    minimum_spend_cents INTEGER,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'fully_paid', 'refunded')),
    
    -- Customer details
    guest_name TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    guest_email TEXT,
    special_requests TEXT,
    occasion TEXT, -- 'birthday', 'anniversary', 'brunch', 'date_night'
    
    -- Confirmation
    confirmation_code TEXT UNIQUE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brunch Events (special recurring events)
CREATE TABLE brunch_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- 'Sunday Brunch', 'Bottomless Brunch'
    description TEXT,
    poster_url TEXT,
    theme TEXT, -- 'afrobeat', 'jazz', 'caribbean', 'rooftop_vibes'
    
    -- Schedule
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Pricing
    price_per_person_cents INTEGER NOT NULL,
    includes TEXT[], -- ['unlimited_drinks', 'buffet', 'live_dj', 'games']
    
    -- Booking rules
    max_party_size INTEGER DEFAULT 8,
    advance_booking_days INTEGER DEFAULT 7, -- Book up to 7 days ahead
    cancellation_hours INTEGER DEFAULT 24, -- Cancel 24h before for refund
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brunch Bookings (linked to brunch events)
CREATE TABLE brunch_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brunch_event_id UUID REFERENCES brunch_events(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    booking_date DATE NOT NULL,
    party_size INTEGER NOT NULL,
    
    -- Pricing
    price_per_person_cents INTEGER NOT NULL,
    total_price_cents INTEGER NOT NULL,
    amount_paid_cents INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'attended', 'cancelled', 'no_show')),
    
    -- Guest details
    guest_name TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    guest_email TEXT,
    
    confirmation_code TEXT UNIQUE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_venues_owner_id ON venues(owner_id);
CREATE INDEX idx_venues_venue_type ON venues(venue_type);
CREATE INDEX idx_tables_venue_id ON tables(venue_id);
CREATE INDEX idx_table_bookings_venue_id ON table_bookings(venue_id);
CREATE INDEX idx_table_bookings_user_id ON table_bookings(user_id);
CREATE INDEX idx_table_bookings_date ON table_bookings(booking_date);
CREATE INDEX idx_table_bookings_status ON table_bookings(status);
CREATE INDEX idx_brunch_events_venue_id ON brunch_events(venue_id);
CREATE INDEX idx_brunch_events_day_of_week ON brunch_events(day_of_week);
CREATE INDEX idx_brunch_bookings_date ON brunch_bookings(booking_date);
CREATE INDEX idx_brunch_bookings_user_id ON brunch_bookings(user_id);

-- RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE brunch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE brunch_bookings ENABLE ROW LEVEL SECURITY;

-- Venues: Public can view, owners can manage
CREATE POLICY "Venues are publicly viewable"
    ON venues FOR SELECT
    USING (is_active = true);

CREATE POLICY "Venue owners can manage their venues"
    ON venues FOR ALL
    USING (auth.uid() = owner_id);

-- Tables: Public can view bookable tables
CREATE POLICY "Tables are publicly viewable"
    ON tables FOR SELECT
    USING (is_bookable = true);

CREATE POLICY "Venue owners can manage tables"
    ON tables FOR ALL
    USING (
        venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
    );

-- Table Bookings: Users can view own, venues can view all for their venue
CREATE POLICY "Users can view own table bookings"
    ON table_bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Venue owners can view their bookings"
    ON table_bookings FOR SELECT
    USING (
        venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
    );

CREATE POLICY "Users can create table bookings"
    ON table_bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Brunch Events: Public can view active
CREATE POLICY "Active brunch events are publicly viewable"
    ON brunch_events FOR SELECT
    USING (is_active = true);

CREATE POLICY "Venue owners can manage brunch events"
    ON brunch_events FOR ALL
    USING (
        venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
    );

-- Brunch Bookings: Similar to table bookings
CREATE POLICY "Users can view own brunch bookings"
    ON brunch_bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Venue owners can view their brunch bookings"
    ON brunch_bookings FOR SELECT
    USING (
        venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
    );

CREATE POLICY "Users can create brunch bookings"
    ON brunch_bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_bookings_updated_at BEFORE UPDATE ON table_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brunch_events_updated_at BEFORE UPDATE ON brunch_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brunch_bookings_updated_at BEFORE UPDATE ON brunch_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate booking confirmation code
CREATE TRIGGER table_booking_confirmation_code
    BEFORE INSERT ON table_bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_confirmation_code();

CREATE TRIGGER brunch_booking_confirmation_code
    BEFORE INSERT ON brunch_bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_confirmation_code();
