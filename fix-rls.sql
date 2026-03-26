-- Fix RLS policies for events table

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view all events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
DROP POLICY IF EXISTS "Public can view events" ON events;

-- Make sure RLS is enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow EVERYONE to view events (public access)
CREATE POLICY "Anyone can view events"
    ON events FOR SELECT
    USING (true);

-- Allow authenticated users to create events
CREATE POLICY "Authenticated users can create events"
    ON events FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own events
CREATE POLICY "Users can update own events"
    ON events FOR UPDATE
    USING (auth.uid()::text = host_id::text);

-- Allow users to delete their own events
CREATE POLICY "Users can delete own events"
    ON events FOR DELETE
    USING (auth.uid()::text = host_id::text);
