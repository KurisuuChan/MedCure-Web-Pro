-- ========================================================================
-- NUCLEAR OPTION: Remove ALL triggers from user_notifications
-- ========================================================================
-- This will drop EVERY possible trigger that could be causing the error
-- Date: October 5, 2025
-- ========================================================================

-- ========================================================================
-- STEP 1: List all triggers (run this first to see what exists)
-- ========================================================================

SELECT 
    trigger_name,
    event_manipulation as event_type,
    action_timing,
    action_statement,
    event_object_schema as schema,
    event_object_table as table_name
FROM information_schema.triggers
WHERE event_object_table = 'user_notifications'
ORDER BY trigger_name;

-- ========================================================================
-- STEP 2: Drop ALL possible trigger names
-- ========================================================================

-- Standard Supabase auto-generated triggers
DROP TRIGGER IF EXISTS update_user_notifications_updated_at ON public.user_notifications;
DROP TRIGGER IF EXISTS handle_updated_at ON public.user_notifications;
DROP TRIGGER IF EXISTS set_updated_at ON public.user_notifications;
DROP TRIGGER IF EXISTS moddatetime ON public.user_notifications;

-- Custom trigger names that might exist
DROP TRIGGER IF EXISTS update_updated_at ON public.user_notifications;
DROP TRIGGER IF EXISTS update_modified_at ON public.user_notifications;
DROP TRIGGER IF EXISTS set_modified_at ON public.user_notifications;
DROP TRIGGER IF EXISTS auto_update_timestamp ON public.user_notifications;
DROP TRIGGER IF EXISTS trigger_set_timestamp ON public.user_notifications;
DROP TRIGGER IF EXISTS update_timestamp ON public.user_notifications;

-- If you know the exact trigger name from STEP 1, add it here:
-- DROP TRIGGER IF EXISTS your_exact_trigger_name ON public.user_notifications;

-- ========================================================================
-- STEP 3: Verify ALL triggers are removed
-- ========================================================================

SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'user_notifications';

-- Should return: 0 rows (no triggers)

-- ========================================================================
-- STEP 4: Check if the trigger function itself exists
-- ========================================================================

-- Sometimes the function needs to be dropped too
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines
WHERE routine_name LIKE '%updated_at%' 
   OR routine_name LIKE '%timestamp%'
ORDER BY routine_name;

-- ========================================================================
-- STEP 5: Drop common trigger functions (optional)
-- ========================================================================

-- Only run these if STEP 4 shows these functions exist
-- and you're sure they're not used by other tables

-- DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
-- DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
-- DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
-- DROP FUNCTION IF EXISTS public.moddatetime() CASCADE;

-- ========================================================================
-- STEP 6: Test in database
-- ========================================================================

-- Try to update a notification directly in the database
-- This should work without errors now

-- UPDATE user_notifications 
-- SET is_read = true 
-- WHERE id = (SELECT id FROM user_notifications LIMIT 1);

-- If this works, test in your app:
-- 1. Refresh browser (F5)
-- 2. Click notification bell
-- 3. Try "Mark all as read"
-- 4. Try "Clear all"
-- 5. Try individual dismiss

-- ========================================================================
-- DEBUGGING: If triggers still exist after dropping
-- ========================================================================

-- Sometimes triggers are on the schema level, not table level
-- Check for schema-level triggers:

SELECT 
    trigger_name,
    event_object_schema,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND trigger_name LIKE '%updated_at%';

-- ========================================================================
-- ALTERNATIVE: Disable ALL triggers temporarily (for testing)
-- ========================================================================

-- This will disable ALL triggers on the table without dropping them
-- ALTER TABLE public.user_notifications DISABLE TRIGGER ALL;

-- To re-enable later:
-- ALTER TABLE public.user_notifications ENABLE TRIGGER ALL;

-- ========================================================================
-- FINAL VERIFICATION
-- ========================================================================

-- After running all DROP TRIGGER commands above, verify:

-- 1. Check triggers
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE event_object_table = 'user_notifications';
-- Should return: trigger_count = 0

-- 2. Try an UPDATE
UPDATE user_notifications 
SET is_read = true 
WHERE user_id = 'b9b31a83-66fd-46e5-b4be-3386c4988f48'
  AND id = (
    SELECT id 
    FROM user_notifications 
    WHERE user_id = 'b9b31a83-66fd-46e5-b4be-3386c4988f48' 
    LIMIT 1
  );
-- Should return: UPDATE 1 (or UPDATE 0 if no rows match)
-- Should NOT return: error about "updated_at"

-- ========================================================================
-- EXPLANATION
-- ========================================================================

/*
Why triggers persist:

1. Supabase sometimes caches trigger definitions
2. Triggers might be created at schema level, not table level
3. Multiple triggers with different names might exist
4. The function behind the trigger still exists

This nuclear option:
- Drops all common trigger names
- Verifies they're gone
- Provides debugging queries
- Includes alternative (disable triggers)

After running this:
- All UPDATE operations should work
- No more "updated_at" errors
- All notification features functional
*/

-- ========================================================================
-- PRODUCTION NOTES
-- ========================================================================

/*
After successful fix:

1. Test ALL notification operations in your app
2. Monitor console for any remaining errors
3. Consider adding proper logging/monitoring
4. Document that updated_at triggers were removed
5. If you need update tracking, add updated_at column first,
   then recreate the trigger with proper column

Security note:
- Dropping triggers doesn't affect security
- Your app-level validation is sufficient
- RLS (if enabled) still protects the data
*/
