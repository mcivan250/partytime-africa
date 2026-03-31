-- Create bookings table for table reservations
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_id TEXT NOT NULL,
  table_number INTEGER,
  guest_count INTEGER NOT NULL DEFAULT 1,
  special_requests TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, table_id) -- Only one booking per table per event
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Enable RLS on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
CREATE POLICY "Users can delete their own bookings"
  ON bookings FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- Create booking history table for audit trail
CREATE TABLE IF NOT EXISTS booking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'cancelled')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Create index for booking history
CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_history(booking_id);

-- Create trigger to log booking changes
CREATE OR REPLACE FUNCTION log_booking_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO booking_history (booking_id, action, new_data, changed_by)
    VALUES (NEW.id, 'created', row_to_json(NEW), auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO booking_history (booking_id, action, old_data, new_data, changed_by)
    VALUES (NEW.id, 'updated', row_to_json(OLD), row_to_json(NEW), auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO booking_history (booking_id, action, old_data, changed_by)
    VALUES (OLD.id, 'cancelled', row_to_json(OLD), auth.uid());
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_changes_trigger ON bookings;
CREATE TRIGGER booking_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION log_booking_changes();

-- Create function to auto-release expired bookings
CREATE OR REPLACE FUNCTION release_expired_bookings()
RETURNS void AS $$
BEGIN
  UPDATE bookings
  SET status = 'cancelled'
  WHERE status = 'pending'
    AND notification_sent = TRUE
    AND notification_time < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create function to get available tables for an event
CREATE OR REPLACE FUNCTION get_available_tables(p_event_id UUID)
RETURNS TABLE (
  table_id TEXT,
  table_number INTEGER,
  capacity INTEGER,
  is_booked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vl.layout_data->'tables'->i->>'id' as table_id,
    (vl.layout_data->'tables'->i->>'number')::INTEGER as table_number,
    (vl.layout_data->'tables'->i->>'capacity')::INTEGER as capacity,
    COALESCE(b.id IS NOT NULL, FALSE) as is_booked
  FROM venue_layouts vl,
       jsonb_array_elements(vl.layout_data->'tables') WITH ORDINALITY AS t(elem, i)
  LEFT JOIN bookings b ON 
    b.event_id = p_event_id AND 
    b.table_id = t.elem->>'id' AND 
    b.status != 'cancelled'
  WHERE vl.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get booking statistics for an event
CREATE OR REPLACE FUNCTION get_booking_stats(p_event_id UUID)
RETURNS TABLE (
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  pending_bookings BIGINT,
  cancelled_bookings BIGINT,
  total_guests BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
    COALESCE(SUM(guest_count), 0) as total_guests
  FROM bookings
  WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;
GRANT SELECT ON booking_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_tables TO authenticated;
GRANT EXECUTE ON FUNCTION get_booking_stats TO authenticated;

-- Create notification for booking reminders (if not exists)
INSERT INTO notifications (user_id, type, title, message, created_at)
SELECT 
  auth.uid(),
  'booking_reminder',
  'Event Reminder',
  'Your event is starting soon!',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM notifications 
  WHERE type = 'booking_reminder' 
  LIMIT 1
);

-- Summary
-- This migration adds:
-- 1. bookings table - stores table reservations
-- 2. booking_history table - audit trail for bookings
-- 3. RLS policies - secure access to booking data
-- 4. Triggers - automatic logging of changes
-- 5. Functions - helper functions for booking management
-- 6. Indexes - performance optimization
