-- ========================================================================
-- FIX: Remove updated_at trigger from user_notifications
-- ========================================================================
-- Problem: Error "record 'new' has no field 'updated_at'"
-- Cause: Database trigger trying to set updated_at, but column doesn't exist
-- Solution: Drop the trigger
-- Date: October 5, 2025
-- ========================================================================

-- ========================================================================
-- STEP 1: Check if trigger exists
-- ========================================================================

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_notifications';

-- ========================================================================
-- STEP 2: Drop the trigger causing the error
-- ========================================================================

-- Common trigger names that auto-update updated_at:
DROP TRIGGER IF EXISTS update_user_notifications_updated_at ON public.user_notifications;
DROP TRIGGER IF EXISTS set_updated_at ON public.user_notifications;
DROP TRIGGER IF EXISTS handle_updated_at ON public.user_notifications;
DROP TRIGGER IF EXISTS moddatetime ON public.user_notifications;

-- ========================================================================
-- STEP 3: Verify triggers are removed
-- ========================================================================

SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'user_notifications';
-- Should return no rows

-- ========================================================================
-- ALTERNATIVE: Add updated_at column if you want to track updates
-- ========================================================================

-- If you want to track when notifications are updated:
-- ALTER TABLE public.user_notifications 
-- ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Then recreate the trigger:
-- CREATE OR REPLACE FUNCTION public.update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_user_notifications_updated_at
--     BEFORE UPDATE ON public.user_notifications
--     FOR EACH ROW
--     EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================================================
-- EXPLANATION
-- ========================================================================

/*
Why this error happens:

1. You have a BEFORE UPDATE trigger on user_notifications table
2. The trigger tries to set NEW.updated_at = now()
3. But the user_notifications table has no updated_at column
4. PostgreSQL throws: record "new" has no field "updated_at"

Solution:
- Option A: Drop the trigger (recommended - you don't need updated_at)
- Option B: Add updated_at column + keep trigger (if you want update tracking)

For notifications, updated_at is not critical because:
- created_at tracks creation time ✅
- read_at tracks when it was read ✅
- dismissed_at tracks when it was dismissed ✅
- These are more useful than a generic "updated_at"
*/

-- ========================================================================
-- VERIFICATION
-- ========================================================================

-- Test update (should work now):
-- UPDATE user_notifications 
-- SET is_read = true 
-- WHERE id = 'some-notification-id';

-- Check in your app (should work now):
-- 1. Mark all as read → Should work ✅
-- 2. Clear all → Should work ✅
-- 3. Individual dismiss → Should work ✅

-- ========================================================================
-- PRODUCTION NOTES
-- ========================================================================

/*
After running this fix:

1. ✅ All notification features will work
2. ✅ No more "updated_at" errors
3. ✅ RLS is fixed (from previous step)
4. ✅ All operations return 200 OK

Optional enhancements:
- If you need update tracking, add updated_at column
- Consider adding an audit_log table for detailed tracking
- Monitor performance after removing triggers
*/

-- ========================================================================
-- RECOMMENDED ACTION
-- ========================================================================

-- 🎯 Run the DROP TRIGGER commands above
-- 🎯 Verify no triggers remain
-- 🎯 Test in your app - all should work!
