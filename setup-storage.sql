-- ============================================================================
-- PartyTime Africa: Supabase Storage Configuration
-- ============================================================================
-- This script configures the 'media' bucket for file uploads.
-- Run this in your Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- 1. CREATE MEDIA BUCKET (if it doesn't exist)
-- ============================================================================

-- Note: Bucket creation via SQL is limited. Prefer using the Supabase Dashboard:
-- 1. Go to Storage
-- 2. Create a new bucket named 'media'
-- 3. Make it private (not public)
-- 4. Apply policies below

-- ============================================================================
-- 2. CREATE STORAGE POLICIES FOR MEDIA BUCKET
-- ============================================================================

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own files
CREATE POLICY "Allow authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to media files (for displaying images/videos)
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'media'
);

-- ============================================================================
-- 3. VERIFY STORAGE POLICIES
-- ============================================================================

-- List all storage policies for the media bucket
SELECT
    name,
    definition,
    roles,
    operation
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND definition LIKE '%media%';

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================
-- Storage policies have been configured.
-- Next steps:
-- 1. Verify the 'media' bucket exists in the Supabase Dashboard
-- 2. Test file uploads using the MediaUpload component
-- 3. Verify uploaded files are accessible via public URLs
-- ============================================================================
