-- Fix Storage RLS policies for event-images and profiles buckets

-- Event Images Bucket Policies
-- Allow anyone to view images
INSERT INTO storage.policies (bucket_id, name, definition, check, command)
VALUES (
  'event-images',
  'Anyone can view event images',
  '(bucket_id = ''event-images'')',
  '(bucket_id = ''event-images'')',
  'SELECT'
) ON CONFLICT (bucket_id, name) DO NOTHING;

-- Allow authenticated users to upload images
INSERT INTO storage.policies (bucket_id, name, definition, check, command)
VALUES (
  'event-images',
  'Authenticated users can upload event images',
  '(bucket_id = ''event-images'' AND auth.role() = ''authenticated'')',
  '(bucket_id = ''event-images'' AND auth.role() = ''authenticated'')',
  'INSERT'
) ON CONFLICT (bucket_id, name) DO NOTHING;

-- Allow users to update their own images
INSERT INTO storage.policies (bucket_id, name, definition, check, command)
VALUES (
  'event-images',
  'Users can update their own event images',
  '(bucket_id = ''event-images'' AND auth.role() = ''authenticated'')',
  '(bucket_id = ''event-images'' AND auth.role() = ''authenticated'')',
  'UPDATE'
) ON CONFLICT (bucket_id, name) DO NOTHING;

-- Profiles Bucket Policies
-- Allow anyone to view profile images
INSERT INTO storage.policies (bucket_id, name, definition, check, command)
VALUES (
  'profiles',
  'Anyone can view profile images',
  '(bucket_id = ''profiles'')',
  '(bucket_id = ''profiles'')',
  'SELECT'
) ON CONFLICT (bucket_id, name) DO NOTHING;

-- Allow authenticated users to upload profile images
INSERT INTO storage.policies (bucket_id, name, definition, check, command)
VALUES (
  'profiles',
  'Authenticated users can upload profile images',
  '(bucket_id = ''profiles'' AND auth.role() = ''authenticated'')',
  '(bucket_id = ''profiles'' AND auth.role() = ''authenticated'')',
  'INSERT'
) ON CONFLICT (bucket_id, name) DO NOTHING;

-- Allow users to update their own profile images
INSERT INTO storage.policies (bucket_id, name, definition, check, command)
VALUES (
  'profiles',
  'Users can update their own profile images',
  '(bucket_id = ''profiles'' AND auth.role() = ''authenticated'')',
  '(bucket_id = ''profiles'' AND auth.role() = ''authenticated'')',
  'UPDATE'
) ON CONFLICT (bucket_id, name) DO NOTHING;
