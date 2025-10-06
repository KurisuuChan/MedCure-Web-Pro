-- ================================================================
-- USER SESSION DIAGNOSTICS
-- ================================================================
-- Purpose: Diagnose why active sessions are not showing
-- Run this in Supabase SQL Editor
-- ================================================================

-- ================================================================
-- 1. CHECK USERS TABLE STRUCTURE
-- ================================================================
SELECT 
    '📋 USERS TABLE SCHEMA' as check_section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
ORDER BY ordinal_position;

-- ================================================================
-- 2. CHECK ALL USERS AND THEIR LAST LOGIN STATUS
-- ================================================================
SELECT 
    '👥 ALL USERS STATUS' as check_section,
    email,
    first_name,
    last_name,
    role,
    is_active,
    last_login,
    CASE 
        WHEN last_login IS NULL THEN '❌ Never logged in'
        WHEN last_login < NOW() - INTERVAL '24 hours' THEN '⏰ Logged in more than 24h ago'
        ELSE '✅ Active session (logged in < 24h)'
    END as session_status,
    CASE 
        WHEN last_login IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (NOW() - last_login))/3600 || ' hours ago'
        ELSE 'Never'
    END as time_since_login,
    created_at
FROM users 
ORDER BY 
    is_active DESC,
    last_login DESC NULLS LAST;

-- ================================================================
-- 3. COUNT ACTIVE VS INACTIVE SESSIONS
-- ================================================================
SELECT 
    '📊 SESSION STATISTICS' as check_section,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
    COUNT(*) FILTER (WHERE last_login IS NULL) as never_logged_in,
    COUNT(*) FILTER (
        WHERE last_login IS NOT NULL 
        AND last_login >= NOW() - INTERVAL '24 hours'
    ) as sessions_in_last_24h,
    COUNT(*) FILTER (
        WHERE last_login IS NOT NULL 
        AND last_login >= NOW() - INTERVAL '1 hour'
    ) as sessions_in_last_hour
FROM users;

-- ================================================================
-- 4. CHECK FOR RECENT LOGIN ACTIVITY (user_activity_logs)
-- ================================================================
-- Check if user_activity_logs table exists
SELECT 
    '📝 ACTIVITY LOGS CHECK' as check_section,
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_activity_logs'
    ) as table_exists;

-- If table exists, show recent login activities
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_activity_logs'
    ) THEN
        RAISE NOTICE '✅ user_activity_logs table exists';
        
        -- Show recent login activities
        PERFORM 
            action_type,
            user_id,
            created_at,
            metadata
        FROM user_activity_logs 
        WHERE action_type = 'login' 
        ORDER BY created_at DESC 
        LIMIT 10;
    ELSE
        RAISE NOTICE '⚠️ user_activity_logs table does NOT exist';
    END IF;
END $$;

-- ================================================================
-- 5. SIMULATE ACTIVE SESSION QUERY
-- ================================================================
-- This is what the frontend is likely running
SELECT 
    '🔍 SIMULATED ACTIVE SESSION QUERY' as check_section,
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.last_login,
    u.is_active,
    NOW() - INTERVAL '24 hours' as cutoff_time,
    CASE 
        WHEN u.last_login >= NOW() - INTERVAL '24 hours' THEN '✅ Would show in active sessions'
        ELSE '❌ Would NOT show (outside 24h window or NULL)'
    END as would_appear_in_ui
FROM users u
WHERE u.is_active = true
ORDER BY u.last_login DESC NULLS LAST;

-- ================================================================
-- 6. CHECK RLS POLICIES ON USERS TABLE
-- ================================================================
SELECT 
    '🔒 RLS POLICIES' as check_section,
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
AND tablename = 'users';

-- ================================================================
-- 7. RECOMMEND FIXES
-- ================================================================
DO $$
DECLARE
    null_login_count INTEGER;
    active_session_count INTEGER;
BEGIN
    -- Count users with NULL last_login
    SELECT COUNT(*) INTO null_login_count
    FROM users 
    WHERE is_active = true AND last_login IS NULL;
    
    -- Count users with recent logins
    SELECT COUNT(*) INTO active_session_count
    FROM users 
    WHERE is_active = true 
    AND last_login >= NOW() - INTERVAL '24 hours';
    
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║             🔍 DIAGNOSTIC SUMMARY                        ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '👥 Active users with NULL last_login: %', null_login_count;
    RAISE NOTICE '✅ Users with sessions in last 24h: %', active_session_count;
    RAISE NOTICE '';
    
    IF null_login_count > 0 THEN
        RAISE NOTICE '⚠️  ISSUE DETECTED: % active users have never logged in', null_login_count;
        RAISE NOTICE '📝 This explains why they don''t appear in "Active Sessions"';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 SOLUTION:';
        RAISE NOTICE '   1. Fix applied in AuthProvider.jsx to track logins';
        RAISE NOTICE '   2. Have each user log out and log back in';
        RAISE NOTICE '   3. Their last_login will be updated automatically';
        RAISE NOTICE '';
        RAISE NOTICE '⚡ QUICK TEST (run this to set admin login time):';
        RAISE NOTICE '   UPDATE users SET last_login = NOW() WHERE email = ''admin@medcure.com'';';
    ELSE
        RAISE NOTICE '✅ All active users have login timestamps!';
    END IF;
    
    IF active_session_count = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '❌ NO ACTIVE SESSIONS DETECTED';
        RAISE NOTICE '   - No users have logged in within the last 24 hours';
        RAISE NOTICE '   - This is why "Active Sessions" section is empty';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ % active sessions found!', active_session_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- ================================================================
-- 8. OPTIONAL: UPDATE TEST USER FOR IMMEDIATE TESTING
-- ================================================================
-- Uncomment below to set admin's last_login to NOW for testing
-- UPDATE users SET last_login = NOW() WHERE email = 'admin@medcure.com';
-- SELECT 'Updated admin last_login to NOW()' as result;
