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
