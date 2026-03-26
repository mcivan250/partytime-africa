-- Messages/Chat System

-- Direct Messages Table
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Chat Table
CREATE TABLE IF NOT EXISTS event_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_created ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_msg_event ON event_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_msg_created ON event_messages(created_at DESC);

-- RLS Policies
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- Direct Messages Policies
DROP POLICY IF EXISTS "Users can view their own DMs" ON direct_messages;
CREATE POLICY "Users can view their own DMs"
    ON direct_messages FOR SELECT
    USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);

DROP POLICY IF EXISTS "Users can send DMs" ON direct_messages;
CREATE POLICY "Users can send DMs"
    ON direct_messages FOR INSERT
    WITH CHECK (auth.uid()::text = sender_id::text);

DROP POLICY IF EXISTS "Users can update their DMs" ON direct_messages;
CREATE POLICY "Users can update their DMs"
    ON direct_messages FOR UPDATE
    USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);

-- Event Messages Policies
DROP POLICY IF EXISTS "Anyone can view event messages" ON event_messages;
CREATE POLICY "Anyone can view event messages"
    ON event_messages FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can send event messages" ON event_messages;
CREATE POLICY "Authenticated users can send event messages"
    ON event_messages FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their event messages" ON event_messages;
CREATE POLICY "Users can delete their event messages"
    ON event_messages FOR DELETE
    USING (auth.uid()::text = user_id::text);
