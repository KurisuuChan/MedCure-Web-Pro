-- ============================================================================
-- NOTIFICATION SYSTEM DATABASE CHECKER
-- ============================================================================
-- Purpose: Verify that all notification system components are properly set up
-- Run this in Supabase SQL Editor to check your database
-- Date: October 7, 2025
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if user_notifications table exists
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🔍 NOTIFICATION SYSTEM DATABASE CHECKER';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- Check table structure
SELECT
    '✅ Table: user_notifications' as status,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_notifications';

-- Show all columns
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_notifications'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: Check indexes on user_notifications
-- ============================================================================
SELECT
    '🔍 CHECKING INDEXES' as section;

SELECT
    indexname as index_name,
    indexdef as definition,
    CASE 
        WHEN indexname LIKE 'idx_user_notifications%' THEN '✅ Custom Index'
        ELSE '⚠️ Default Index'
    END as status
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'user_notifications'
ORDER BY indexname;

-- Expected indexes:
SELECT
    '📋 EXPECTED INDEXES:' as info,
    'idx_user_notifications_user_id' as index_1,
    'idx_user_notifications_user_unread' as index_2,
    'idx_user_notifications_category' as index_3,
    'idx_user_notifications_priority_unread' as index_4,
    'idx_user_notifications_metadata_gin' as index_5,
    'idx_user_notifications_created_at' as index_6,
    'idx_user_notifications_email_pending' as index_7;

-- Check which indexes are MISSING
WITH required_indexes AS (
    SELECT unnest(ARRAY[
        'idx_user_notifications_user_id',
        'idx_user_notifications_user_unread',
        'idx_user_notifications_category',
        'idx_user_notifications_priority_unread',
        'idx_user_notifications_metadata_gin',
        'idx_user_notifications_created_at',
        'idx_user_notifications_email_pending'
    ]) AS index_name
),
existing_indexes AS (
    SELECT indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'user_notifications'
)
SELECT
    CASE 
        WHEN COUNT(r.index_name) = 0 THEN '✅ All required indexes exist'
        ELSE '❌ MISSING INDEXES: ' || string_agg(r.index_name, ', ')
    END as status
FROM required_indexes r
LEFT JOIN existing_indexes e ON r.index_name = e.indexname
WHERE e.indexname IS NULL;

-- ============================================================================
-- STEP 3: Check notification_deduplication table
-- ============================================================================
SELECT
    '🔍 CHECKING DEDUPLICATION TABLE' as section;

SELECT
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = 'notification_deduplication'
        ) THEN '✅ Table exists: notification_deduplication'
        ELSE '❌ MISSING: notification_deduplication table'
    END as status;

-- Show deduplication table structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notification_deduplication'
ORDER BY ordinal_position;

-- Check unique constraint
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'notification_deduplication'
  AND constraint_type = 'UNIQUE';

-- ============================================================================
-- STEP 4: Check RPC functions
-- ============================================================================
SELECT
    '🔍 CHECKING RPC FUNCTIONS' as section;

-- Check should_send_notification function
SELECT
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
              AND p.proname = 'should_send_notification'
        ) THEN '✅ Function exists: should_send_notification'
        ELSE '❌ MISSING: should_send_notification function'
    END as status;

-- Check record_health_check_run function
SELECT
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
              AND p.proname = 'record_health_check_run'
        ) THEN '✅ Function exists: record_health_check_run'
        ELSE '⚠️ Optional: record_health_check_run function (for health checks)'
    END as status;

-- Check cleanup_old_notifications function
SELECT
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
              AND p.proname = 'cleanup_old_notifications'
        ) THEN '✅ Function exists: cleanup_old_notifications'
        ELSE '⚠️ Optional: cleanup_old_notifications function'
    END as status;

-- List all notification-related functions
SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND (
    p.proname LIKE '%notification%' 
    OR p.proname LIKE '%health_check%'
  )
ORDER BY p.proname;

-- ============================================================================
-- STEP 5: Check actual data
-- ============================================================================
SELECT
    '🔍 CHECKING DATA' as section;

-- Count total notifications
SELECT
    '📊 Total notifications' as metric,
    COUNT(*) as count
FROM user_notifications;

-- Count notifications by category
SELECT
    '📊 Notifications by category' as metric,
    category,
    COUNT(*) as count,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
FROM user_notifications
GROUP BY category
ORDER BY count DESC;

-- Count notifications by user
SELECT
    '📊 Notifications by user' as metric,
    user_id,
    COUNT(*) as total,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread
FROM user_notifications
GROUP BY user_id
ORDER BY total DESC
LIMIT 10;

-- Recent notifications (last 24 hours)
SELECT
    '📊 Recent notifications (last 24 hours)' as metric,
    COUNT(*) as count
FROM user_notifications
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check deduplication entries
SELECT
    '📊 Deduplication entries' as metric,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN last_sent_at > NOW() - INTERVAL '24 hours' THEN 1 END) as active_entries
FROM notification_deduplication;

-- ============================================================================
-- STEP 6: Test queries (performance check)
-- ============================================================================
SELECT
    '🔍 TESTING QUERY PERFORMANCE' as section;

-- Test 1: Get unread count (should use idx_user_notifications_user_unread)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT COUNT(*)
FROM user_notifications
WHERE user_id = (SELECT id FROM users LIMIT 1)
  AND is_read = false
  AND dismissed_at IS NULL;

-- Test 2: Get recent notifications (should use idx_user_notifications_created_at)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, title, message, created_at
FROM user_notifications
WHERE user_id = (SELECT id FROM users LIMIT 1)
  AND is_read = false
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- STEP 7: Check RLS (Row Level Security) - IF ENABLED
-- ============================================================================
SELECT
    '🔍 CHECKING ROW LEVEL SECURITY' as section;

SELECT
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '⚠️ RLS Disabled (currently expected)'
    END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('user_notifications', 'notification_deduplication');

-- Show RLS policies if any
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('user_notifications', 'notification_deduplication');

-- ============================================================================
-- STEP 8: Final Summary
-- ============================================================================
DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_dedup_exists BOOLEAN;
    v_function_exists BOOLEAN;
    v_index_count INTEGER;
    v_notification_count INTEGER;
BEGIN
    -- Check components
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_notifications'
    ) INTO v_table_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notification_deduplication'
    ) INTO v_dedup_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'should_send_notification'
    ) INTO v_function_exists;
    
    SELECT COUNT(*) FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'user_notifications'
      AND indexname LIKE 'idx_user_notifications%'
    INTO v_index_count;
    
    SELECT COUNT(*) FROM user_notifications INTO v_notification_count;
    
    -- Print summary
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📋 FINAL SUMMARY';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    IF v_table_exists THEN
        RAISE NOTICE '✅ user_notifications table: EXISTS';
    ELSE
        RAISE NOTICE '❌ user_notifications table: MISSING';
    END IF;
    
    IF v_dedup_exists THEN
        RAISE NOTICE '✅ notification_deduplication table: EXISTS';
    ELSE
        RAISE NOTICE '❌ notification_deduplication table: MISSING (run 002_notification_deduplication.sql)';
    END IF;
    
    IF v_function_exists THEN
        RAISE NOTICE '✅ should_send_notification function: EXISTS';
    ELSE
        RAISE NOTICE '❌ should_send_notification function: MISSING (run 002_notification_deduplication.sql)';
    END IF;
    
    IF v_index_count >= 7 THEN
        RAISE NOTICE '✅ Indexes: % of 7 required indexes exist', v_index_count;
    ELSE
        RAISE NOTICE '⚠️ Indexes: Only % of 7 required indexes exist (run 001_add_notification_indexes.sql)', v_index_count;
    END IF;
    
    RAISE NOTICE '📊 Total notifications in database: %', v_notification_count;
    
    RAISE NOTICE '';
    
    -- Overall status
    IF v_table_exists AND v_dedup_exists AND v_function_exists AND v_index_count >= 7 THEN
        RAISE NOTICE '🎉 SUCCESS: All notification system components are properly configured!';
    ELSE
        RAISE NOTICE '⚠️ ACTION REQUIRED: Some components are missing. Follow the steps above to fix.';
    END IF;
    
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ============================================================================
-- STEP 9: Quick Fix Commands (if needed)
-- ============================================================================

SELECT '📝 QUICK FIX COMMANDS' as section;

SELECT 
    '-- If indexes are missing, run:' as command,
    '-- database/migrations/001_add_notification_indexes.sql' as file;

SELECT 
    '-- If deduplication table is missing, run:' as command,
    '-- database/migrations/002_notification_deduplication.sql' as file;

SELECT 
    '-- To test notification creation:' as command,
    '-- INSERT INTO user_notifications (user_id, title, message, type, priority, category) VALUES (''YOUR_USER_ID'', ''Test'', ''Test message'', ''info'', 3, ''general'')' as example;
