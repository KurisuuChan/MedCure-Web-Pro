-- ============================================================================
-- NOTIFICATION SYSTEM MIGRATION - CLEAN VERSION
-- This version aggressively cleans ALL existing function versions first
-- Date: October 7, 2025
-- ============================================================================

-- ============================================================================
-- STEP 0: AGGRESSIVE CLEANUP - Drop ALL existing function versions
-- ============================================================================

-- Drop all possible versions of should_send_notification
DROP FUNCTION IF EXISTS should_send_notification(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS should_send_notification(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS should_send_notification(UUID) CASCADE;
DROP FUNCTION IF EXISTS should_send_notification() CASCADE;

-- Drop all possible versions of should_run_health_check
DROP FUNCTION IF EXISTS should_run_health_check(TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS should_run_health_check(TEXT) CASCADE;
DROP FUNCTION IF EXISTS should_run_health_check(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS should_run_health_check() CASCADE;

-- Drop all possible versions of record_health_check_run
DROP FUNCTION IF EXISTS record_health_check_run(TEXT, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_health_check_run(TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS record_health_check_run(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_health_check_run(INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_health_check_run(TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_health_check_run(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS record_health_check_run() CASCADE;

-- Drop all possible versions of cleanup_old_notifications
DROP FUNCTION IF EXISTS cleanup_old_notifications(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_notifications() CASCADE;

-- ============================================================================
-- STEP 1: Create health_check_runs tracking table
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_check_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL,
  run_at TIMESTAMP NOT NULL DEFAULT NOW(),
  notifications_created INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_health_check_runs_check_type_run_at 
  ON health_check_runs(check_type, run_at DESC);

COMMENT ON TABLE health_check_runs IS 'Tracks when health checks were run to prevent spam';

-- ============================================================================
-- STEP 2: Create should_send_notification function (prevents duplicates)
-- ============================================================================
CREATE FUNCTION should_send_notification(
  p_user_id UUID,
  p_notification_key TEXT,
  p_cooldown_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_sent_at TIMESTAMP;
  v_cooldown_period INTERVAL;
BEGIN
  v_cooldown_period := (p_cooldown_hours || ' hours')::INTERVAL;
  
  -- Check if similar notification was sent recently
  SELECT MAX(created_at) INTO v_last_sent_at
  FROM user_notifications
  WHERE user_id = p_user_id
    AND metadata->>'notification_key' = p_notification_key
    AND dismissed_at IS NULL
    AND created_at > (NOW() - v_cooldown_period);
  
  -- Return TRUE if we should send (no recent notification found)
  RETURN v_last_sent_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION should_send_notification(UUID, TEXT, INTEGER) TO authenticated;
COMMENT ON FUNCTION should_send_notification(UUID, TEXT, INTEGER) IS 'Prevents duplicate notifications by checking cooldown period';

-- ============================================================================
-- STEP 3: Create should_run_health_check function (prevents spam)
-- ============================================================================
CREATE FUNCTION should_run_health_check(
  p_check_type TEXT,
  p_interval_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_run_at TIMESTAMP;
  v_interval INTERVAL;
BEGIN
  v_interval := (p_interval_minutes || ' minutes')::INTERVAL;
  
  -- Get last successful run
  SELECT MAX(run_at) INTO v_last_run_at
  FROM health_check_runs
  WHERE check_type = p_check_type
    AND run_at > (NOW() - v_interval);
  
  -- Return TRUE if enough time has passed
  RETURN v_last_run_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION should_run_health_check(TEXT, INTEGER) TO authenticated;
COMMENT ON FUNCTION should_run_health_check(TEXT, INTEGER) IS 'Prevents health checks from running too frequently';

-- ============================================================================
-- STEP 4: Create record_health_check_run function
-- ============================================================================
CREATE FUNCTION record_health_check_run(
  p_check_type TEXT,
  p_notifications_created INTEGER,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID;
BEGIN
  INSERT INTO health_check_runs (
    check_type,
    run_at,
    notifications_created,
    error_message
  )
  VALUES (
    p_check_type,
    NOW(),
    p_notifications_created,
    p_error_message
  )
  RETURNING id INTO v_run_id;
  
  RETURN v_run_id;
END;
$$;

GRANT EXECUTE ON FUNCTION record_health_check_run(TEXT, INTEGER, TEXT) TO authenticated;
COMMENT ON FUNCTION record_health_check_run(TEXT, INTEGER, TEXT) IS 'Records health check execution for tracking';

-- ============================================================================
-- STEP 5: Create cleanup_old_notifications function
-- ============================================================================
CREATE FUNCTION cleanup_old_notifications(
  days_old INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete old dismissed notifications
  DELETE FROM user_notifications
  WHERE dismissed_at IS NOT NULL
    AND dismissed_at < (NOW() - (days_old || ' days')::INTERVAL);
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Also delete very old read notifications (90+ days)
  DELETE FROM user_notifications
  WHERE is_read = TRUE
    AND read_at < (NOW() - '90 days'::INTERVAL)
    AND dismissed_at IS NULL;
  
  RETURN v_deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_old_notifications(INTEGER) TO authenticated;
COMMENT ON FUNCTION cleanup_old_notifications(INTEGER) IS 'Removes old dismissed and read notifications';

-- ============================================================================
-- STEP 6: Add performance indexes
-- ============================================================================

-- Speed up notification queries by user and date
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id_created_at 
  ON user_notifications(user_id, created_at DESC);

-- Speed up unread count queries
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id_is_read 
  ON user_notifications(user_id, is_read) 
  WHERE dismissed_at IS NULL;

-- Speed up category filtering
CREATE INDEX IF NOT EXISTS idx_user_notifications_category_created_at 
  ON user_notifications(category, created_at DESC);

-- Speed up deduplication queries (IMPORTANT!)
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_key 
  ON user_notifications(user_id, ((metadata->>'notification_key')), created_at DESC)
  WHERE dismissed_at IS NULL;

-- ============================================================================
-- VERIFICATION: Check that all functions were created
-- ============================================================================
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'should_send_notification',
    'should_run_health_check',
    'record_health_check_run',
    'cleanup_old_notifications'
  )
ORDER BY routine_name;

-- Expected: Should return 4 rows

-- ============================================================================
-- VERIFICATION: Check that all indexes were created
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_notifications', 'health_check_runs')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Expected: Should return multiple indexes

-- ============================================================================
-- VERIFICATION: Test the functions
-- ============================================================================

-- Test should_send_notification (should return TRUE - no recent notification)
SELECT should_send_notification(
  gen_random_uuid(), -- Test user ID
  'test-notification-key',
  24
) as can_send;

-- Test should_run_health_check (should return TRUE - no recent check)
SELECT should_run_health_check('all', 15) as should_run;

-- Test record_health_check_run
SELECT record_health_check_run('all', 0, NULL) as run_id;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Notification system migration completed successfully!';
  RAISE NOTICE '✅ All functions created and indexed';
  RAISE NOTICE '✅ Ready for NotificationService.js updates';
END $$;
