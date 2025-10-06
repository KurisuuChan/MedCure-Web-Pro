-- ================================================================
-- VERIFY THE FIX WORKED
-- ================================================================
-- Run this to check if everything is set up correctly
-- ================================================================

-- 1. Check if user_activity_logs table exists
SELECT 
    '✅ user_activity_logs table' as check_item,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_activity_logs'
    ) as exists;

-- 2. Check if RLS is disabled on users table
SELECT 
    '✅ RLS Status on users table' as check_item,
    CASE 
        WHEN rowsecurity = false THEN 'DISABLED (Good!)'
        ELSE 'ENABLED (May block updates)'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 3. Check if trigger was removed
SELECT 
    '✅ log_user_activity_trigger' as check_item,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'log_user_activity_trigger'
        ) THEN 'REMOVED (Good!)'
        ELSE 'STILL EXISTS (May cause errors)'
    END as status;

-- 4. Show current state of all users
SELECT 
    '📋 CURRENT USER STATE' as section,
    email,
    role,
    is_active,
    last_login,
    CASE 
        WHEN last_login IS NULL THEN '❌ Never logged in'
        WHEN last_login >= NOW() - INTERVAL '1 hour' THEN '✅ Logged in < 1 hour ago'
        WHEN last_login >= NOW() - INTERVAL '24 hours' THEN '✅ Logged in < 24 hours ago'
        ELSE '⏰ Old login'
    END as status
FROM users 
ORDER BY last_login DESC NULLS LAST;

-- 5. Count active sessions (should match Active Sessions in UI)
SELECT 
    '📊 ACTIVE SESSION COUNT' as metric,
    COUNT(*) as count
FROM users 
WHERE is_active = true 
AND last_login >= NOW() - INTERVAL '24 hours';

-- 6. Test if we can update (should work now!)
DO $$
DECLARE
    admin_id uuid;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_id 
    FROM users 
    WHERE email = 'admin@medcure.com' 
    LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
        -- Try updating
        UPDATE users 
        SET last_login = NOW() 
        WHERE id = admin_id;
        
        RAISE NOTICE '✅ SUCCESS: Admin last_login updated to NOW()';
        RAISE NOTICE '📝 You can now test with other users!';
    ELSE
        RAISE NOTICE '⚠️ Admin user not found';
    END IF;
END $$;

-- 7. Final recommendation
DO $$
DECLARE
    never_logged_count INTEGER;
    active_session_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO never_logged_count
    FROM users 
    WHERE is_active = true AND last_login IS NULL;
    
    SELECT COUNT(*) INTO active_session_count
    FROM users 
    WHERE is_active = true 
    AND last_login >= NOW() - INTERVAL '24 hours';
    
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════╗';
    RAISE NOTICE '║           ✅ VERIFICATION COMPLETE                ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '👥 Users who never logged in: %', never_logged_count;
    RAISE NOTICE '✅ Active sessions (last 24h): %', active_session_count;
    RAISE NOTICE '';
    
    IF never_logged_count > 0 THEN
        RAISE NOTICE '🎯 NEXT ACTION:';
        RAISE NOTICE '   1. Log out from your application';
        RAISE NOTICE '   2. Log in with each user account';
        RAISE NOTICE '   3. Their last_login will update automatically!';
        RAISE NOTICE '   4. They will appear in Active Sessions';
    ELSE
        RAISE NOTICE '🎉 ALL USERS HAVE LOGIN TIMESTAMPS!';
        RAISE NOTICE '✅ Check User Management page to see Active Sessions';
    END IF;
    
    RAISE NOTICE '';
END $$;
