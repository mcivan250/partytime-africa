-- Add media fields to direct_messages table if they don't exist
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'audio'));

-- Add media fields to event_messages table if they don't exist
ALTER TABLE event_messages
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'audio'));

-- Create indexes for media queries
CREATE INDEX IF NOT EXISTS idx_dm_media ON direct_messages(media_url) WHERE media_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_msg_media ON event_messages(media_url) WHERE media_url IS NOT NULL;
