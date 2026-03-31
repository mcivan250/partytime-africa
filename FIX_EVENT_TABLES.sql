-- ============================================================
-- FIX: Add Event-Based Table Booking Support
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- Create event_tables table for event-specific table bookings
CREATE TABLE IF NOT EXISTS event_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
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

-- Create event_table_bookings table
CREATE TABLE IF NOT EXISTS event_table_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_table_id UUID REFERENCES event_tables(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    party_size INTEGER NOT NULL,
    total_price_cents INTEGER NOT NULL,
    deposit_paid_cents INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'fully_paid', 'refunded')),
    guest_name TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    guest_email TEXT,
    special_requests TEXT,
    confirmation_code TEXT UNIQUE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_venue_layouts table for event-specific layouts
CREATE TABLE IF NOT EXISTS event_venue_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    layout_name TEXT NOT NULL,
    layout_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_tables_event_id ON event_tables(event_id);
CREATE INDEX IF NOT EXISTS idx_event_table_bookings_event_id ON event_table_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_table_bookings_user_id ON event_table_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_event_table_bookings_date ON event_table_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_event_venue_layouts_event_id ON event_venue_layouts(event_id);

-- Enable RLS
ALTER TABLE event_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_table_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_venue_layouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Event tables are publicly viewable" ON event_tables FOR SELECT USING (is_bookable = true);
CREATE POLICY "Event organizers can manage tables" ON event_tables FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE host_id = auth.uid())
);

CREATE POLICY "Users can view own event table bookings" ON event_table_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Event organizers can view their bookings" ON event_table_bookings FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE host_id = auth.uid())
);
CREATE POLICY "Users can create event table bookings" ON event_table_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Event layouts are publicly viewable" ON event_venue_layouts FOR SELECT USING (is_active = true);
CREATE POLICY "Event organizers can manage layouts" ON event_venue_layouts FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE host_id = auth.uid())
);

-- Triggers
CREATE TRIGGER update_event_table_bookings_updated_at BEFORE UPDATE ON event_table_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_venue_layouts_updated_at BEFORE UPDATE ON event_venue_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER event_table_booking_confirmation_code BEFORE INSERT ON event_table_bookings
    FOR EACH ROW EXECUTE FUNCTION set_confirmation_code();
