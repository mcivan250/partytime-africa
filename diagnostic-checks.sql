-- ============================================================================
-- PartyTime Africa: Diagnostic Checks
-- ============================================================================
-- This script checks the status of all critical configurations.
-- Run this in your Supabase SQL Editor to verify everything is set up correctly.
-- ============================================================================

-- ============================================================================
-- 1. CHECK TABLE EXISTENCE
-- ============================================================================

-- Check if all required tables exist
SELECT
    'direct_messages' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'direct_messages') as exists
UNION ALL
SELECT
    'notifications' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') as exists
UNION ALL
SELECT
    'event_messages' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_messages') as exists
UNION ALL
SELECT
    'users' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') as exists;

-- ============================================================================
-- 2. CHECK TABLE COLUMNS
-- ============================================================================

-- Check direct_messages columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'direct_messages'
ORDER BY ordinal_position;

-- Check notifications columns
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. CHECK RLS STATUS
-- ============================================================================

-- Check if RLS is enabled on required tables
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('direct_messages', 'notifications', 'event_messages');

-- ============================================================================
-- 4. CHECK RLS POLICIES
-- ============================================================================

-- Check policies on direct_messages
SELECT
    policyname,
    tablename,
    permissive,
    roles,
    qual as select_condition,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'direct_messages'
ORDER BY policyname;

-- Check policies on notifications
SELECT
    policyname,
    tablename,
    permissive,
    roles,
    qual as select_condition,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'notifications'
ORDER BY policyname;

-- Check policies on event_messages
SELECT
    policyname,
    tablename,
    permissive,
    roles,
    qual as select_condition,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'event_messages'
ORDER BY policyname;

-- ============================================================================
-- 5. CHECK INDEXES
-- ============================================================================

-- Check indexes on direct_messages
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'direct_messages'
ORDER BY indexname;

-- Check indexes on notifications
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'notifications'
ORDER BY indexname;

-- ============================================================================
-- 6. CHECK REPLICATION STATUS
-- ============================================================================

-- Check if tables are in the replication publication
SELECT
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('direct_messages', 'notifications', 'event_messages');

-- ============================================================================
-- 7. CHECK DATA INTEGRITY
-- ============================================================================

-- Count records in each table
SELECT
    'direct_messages' as table_name,
    COUNT(*) as record_count
FROM direct_messages
UNION ALL
SELECT
    'notifications' as table_name,
    COUNT(*) as record_count
FROM notifications
UNION ALL
SELECT
    'event_messages' as table_name,
    COUNT(*) as record_count
FROM event_messages;

-- Check for orphaned records (messages without valid sender/receiver)
SELECT
    COUNT(*) as orphaned_direct_messages
FROM direct_messages dm
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = dm.sender_id)
   OR NOT EXISTS (SELECT 1 FROM users WHERE id = dm.receiver_id);

-- Check for orphaned notifications
SELECT
    COUNT(*) as orphaned_notifications
FROM notifications n
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = n.user_id);

-- ============================================================================
-- 8. CHECK CONSTRAINT VIOLATIONS
-- ============================================================================

-- Check for invalid notification types
SELECT DISTINCT type
FROM notifications
WHERE type NOT IN ('message', 'event', 'payment', 'system');

-- Check for invalid media types
SELECT DISTINCT media_type
FROM direct_messages
WHERE media_type IS NOT NULL
AND media_type NOT IN ('image', 'video', 'audio');

-- ============================================================================
-- 9. PERFORMANCE STATISTICS
-- ============================================================================

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('direct_messages', 'notifications', 'event_messages')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename IN ('direct_messages', 'notifications', 'event_messages')
ORDER BY idx_scan DESC;

-- ============================================================================
-- 10. SUMMARY REPORT
-- ============================================================================

-- Generate a summary of the diagnostic results
WITH diagnostic_summary AS (
    SELECT
        'Tables Exist' as check_name,
        CASE
            WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('direct_messages', 'notifications', 'event_messages')) = 3
            THEN '✓ PASS'
            ELSE '✗ FAIL'
        END as status
    UNION ALL
    SELECT
        'RLS Enabled',
        CASE
            WHEN (SELECT COUNT(*) FROM pg_tables WHERE tablename IN ('direct_messages', 'notifications', 'event_messages') AND rowsecurity = true) = 3
            THEN '✓ PASS'
            ELSE '✗ FAIL'
        END
    UNION ALL
    SELECT
        'RLS Policies Configured',
        CASE
            WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('direct_messages', 'notifications', 'event_messages')) >= 8
            THEN '✓ PASS'
            ELSE '✗ FAIL'
        END
    UNION ALL
    SELECT
        'Replication Enabled',
        CASE
            WHEN (SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename IN ('direct_messages', 'notifications', 'event_messages')) = 3
            THEN '✓ PASS'
            ELSE '✗ FAIL'
        END
    UNION ALL
    SELECT
        'Indexes Created',
        CASE
            WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('direct_messages', 'notifications')) >= 6
            THEN '✓ PASS'
            ELSE '✗ FAIL'
        END
    UNION ALL
    SELECT
        'Data Integrity',
        CASE
            WHEN (SELECT COUNT(*) FROM direct_messages WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = sender_id)) = 0
                AND (SELECT COUNT(*) FROM notifications WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = user_id)) = 0
            THEN '✓ PASS'
            ELSE '✗ FAIL'
        END
)
SELECT * FROM diagnostic_summary;

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================
-- Review the diagnostic results above.
-- If any checks fail, refer to the Troubleshooting Guide for solutions.
-- ============================================================================
