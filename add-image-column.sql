-- Add image_url column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Add image_url to users table for profile photos
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_path TEXT;

SELECT 'Image columns added successfully!' AS result;
