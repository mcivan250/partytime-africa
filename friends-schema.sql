-- Friends/Connections Table
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

-- RLS Policies
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Users can see their own friendships
CREATE POLICY "Users can view their own friendships"
    ON friends FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can create friendship requests
CREATE POLICY "Users can create friendships"
    ON friends FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update friendships they're part of
CREATE POLICY "Users can update their friendships"
    ON friends FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can delete their friendships
CREATE POLICY "Users can delete their friendships"
    ON friends FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);
