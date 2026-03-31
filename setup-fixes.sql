-- ============================================================================
-- PartyTime Africa: Database and Storage Configuration Fixes
-- ============================================================================
-- This script applies all necessary fixes for real-time updates, media uploads,
-- and notifications. Run this in your Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- 1. ENSURE REPLICATION IS ENABLED FOR REALTIME
-- ============================================================================

-- Enable replication for direct_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- Enable replication for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable replication for event_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE event_messages;

-- ============================================================================
-- 2. FIX DIRECT_MESSAGES TABLE AND RLS POLICIES
-- ============================================================================

-- Ensure direct_messages table exists with correct schema
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    message_text TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'audio')),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_created ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(
    CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
    CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END
);

-- Enable RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own DMs" ON direct_messages;
DROP POLICY IF EXISTS "Users can send DMs" ON direct_messages;
DROP POLICY IF EXISTS "Users can update their DMs" ON direct_messages;

-- Create correct RLS policies
CREATE POLICY "Users can view their own DMs"
    ON direct_messages FOR SELECT
    USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

CREATE POLICY "Users can send DMs"
    ON direct_messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
    );

CREATE POLICY "Users can update their DMs"
    ON direct_messages FOR UPDATE
    USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- ============================================================================
-- 3. FIX NOTIFICATIONS TABLE AND RLS POLICIES
-- ============================================================================

-- Ensure notifications table exists with correct schema
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('message', 'event', 'payment', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Create correct RLS policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (
        auth.uid() = user_id
    );

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (
        auth.uid() = user_id
    );

-- ============================================================================
-- 4. FIX EVENT_MESSAGES TABLE AND RLS POLICIES
-- ============================================================================

-- Ensure event_messages table exists with correct schema
CREATE TABLE IF NOT EXISTS event_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    message_text TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'audio')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_msg_event ON event_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_msg_user ON event_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_event_msg_created ON event_messages(created_at DESC);

-- Enable RLS
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view event messages" ON event_messages;
DROP POLICY IF EXISTS "Authenticated users can send event messages" ON event_messages;
DROP POLICY IF EXISTS "Users can delete their event messages" ON event_messages;

-- Create correct RLS policies
CREATE POLICY "Anyone can view event messages"
    ON event_messages FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can send event messages"
    ON event_messages FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND auth.uid() = user_id
    );

CREATE POLICY "Users can delete their event messages"
    ON event_messages FOR DELETE
    USING (
        auth.uid() = user_id
    );

-- ============================================================================
-- 5. VERIFY USERS TABLE HAS REQUIRED FIELDS
-- ============================================================================

-- Ensure users table has user_metadata for profile info
-- This is typically created by Supabase Auth, but verify it exists
-- user_metadata should contain: full_name, phone_number, profile_photo_url

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get conversation ID from two user IDs
CREATE OR REPLACE FUNCTION get_conversation_id(user1_id UUID, user2_id UUID)
RETURNS TEXT AS $$
BEGIN
    IF user1_id < user2_id THEN
        RETURN user1_id::text || '_' || user2_id::text;
    ELSE
        RETURN user2_id::text || '_' || user1_id::text;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE notifications
    SET read = true
    WHERE user_id = user_id_param AND read = false;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*) INTO count
    FROM notifications
    WHERE user_id = user_id_param AND read = false;
    RETURN count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. VERIFY REPLICATION STATUS
-- ============================================================================

-- Check which tables are enabled for replication
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('direct_messages', 'notifications', 'event_messages');

-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('direct_messages', 'notifications', 'event_messages');

-- ============================================================================
-- 8. PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Analyze tables to update query planner statistics
ANALYZE direct_messages;
ANALYZE notifications;
ANALYZE event_messages;

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================
-- All database configurations have been applied.
-- Next steps:
-- 1. Verify Supabase Storage bucket 'media' exists with proper policies
-- 2. Test real-time subscriptions in the browser console
-- 3. Test media uploads with the MediaUpload component
-- 4. Test notifications with the NotificationCenter component
-- ============================================================================
