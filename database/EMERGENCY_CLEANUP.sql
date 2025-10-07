-- ============================================================================
-- EMERGENCY CLEANUP - Remove ALL conflicting function versions
-- This script will forcefully drop ALL versions of the conflicting functions
-- ============================================================================

-- Step 1: Find and drop ALL versions of should_run_health_check
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'should_run_health_check'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                      func_record.proname, 
                      func_record.args);
        RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
    END LOOP;
END $$;

-- Step 2: Find and drop ALL versions of should_send_notification
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'should_send_notification'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                      func_record.proname, 
                      func_record.args);
        RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
    END LOOP;
END $$;

-- Step 3: Find and drop ALL versions of record_health_check_run
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'record_health_check_run'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                      func_record.proname, 
                      func_record.args);
        RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
    END LOOP;
END $$;

-- Step 4: Find and drop ALL versions of cleanup_old_notifications
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'cleanup_old_notifications'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                      func_record.proname, 
                      func_record.args);
        RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
    END LOOP;
END $$;

-- ============================================================================
-- Now create the fresh functions
-- ============================================================================

-- Create should_send_notification
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
  
  SELECT MAX(created_at) INTO v_last_sent_at
  FROM user_notifications
  WHERE user_id = p_user_id
    AND metadata->>'notification_key' = p_notification_key
    AND dismissed_at IS NULL
    AND created_at > (NOW() - v_cooldown_period);
  
  RETURN v_last_sent_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION should_send_notification(UUID, TEXT, INTEGER) TO authenticated;

-- Create should_run_health_check
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
  
  SELECT MAX(run_at) INTO v_last_run_at
  FROM health_check_runs
  WHERE check_type = p_check_type
    AND run_at > (NOW() - v_interval);
  
  RETURN v_last_run_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION should_run_health_check(TEXT, INTEGER) TO authenticated;

-- Create record_health_check_run
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

-- Create cleanup_old_notifications
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
  DELETE FROM user_notifications
  WHERE dismissed_at IS NOT NULL
    AND dismissed_at < (NOW() - (days_old || ' days')::INTERVAL);
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  DELETE FROM user_notifications
  WHERE is_read = TRUE
    AND read_at < (NOW() - '90 days'::INTERVAL)
    AND dismissed_at IS NULL;
  
  RETURN v_deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_old_notifications(INTEGER) TO authenticated;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN (
    'should_send_notification',
    'should_run_health_check',
    'record_health_check_run',
    'cleanup_old_notifications'
  )
ORDER BY p.proname;

-- ============================================================================
-- SUCCESS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Emergency cleanup completed!';
  RAISE NOTICE '✅ All conflicting functions removed and recreated!';
  RAISE NOTICE '✅ No more function overloading conflicts!';
END $$;
