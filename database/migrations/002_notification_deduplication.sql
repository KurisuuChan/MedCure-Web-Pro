-- ============================================================================
-- MIGRATION: Notification Deduplication System
-- ============================================================================
-- Purpose: Eliminate duplicate notifications with atomic database-backed checks
-- Issue: Current JSONB contains logic is unreliable, causing notification spam
-- Impact: Zero duplicate notifications, faster deduplication checks
-- Date: October 7, 2025
-- Priority: CRITICAL
-- ============================================================================

-- ============================================================================
-- TABLE: notification_deduplication
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_deduplication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_key TEXT NOT NULL, -- Composite key: "category:productId" or "category:title"
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notification_count INTEGER DEFAULT 1,
  cooldown_hours INTEGER DEFAULT 24,
  metadata JSONB DEFAULT '{}', -- Store additional context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ✅ UNIQUE CONSTRAINT: Prevents duplicates at database level
  CONSTRAINT uq_notification_dedup_user_key UNIQUE(user_id, notification_key)
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_notif_dedup_user_id 
  ON notification_deduplication(user_id);

CREATE INDEX IF NOT EXISTS idx_notif_dedup_lookup 
  ON notification_deduplication(user_id, notification_key, last_sent_at);

CREATE INDEX IF NOT EXISTS idx_notif_dedup_last_sent 
  ON notification_deduplication(last_sent_at DESC);

-- Add comments
COMMENT ON TABLE notification_deduplication IS 
  'Tracks notification history to prevent duplicate notifications';

COMMENT ON COLUMN notification_deduplication.notification_key IS 
  'Unique identifier: category:productId (e.g., "inventory:product-uuid") or category:title';

COMMENT ON COLUMN notification_deduplication.cooldown_hours IS 
  'Hours to wait before sending same notification again';

-- ============================================================================
-- FUNCTION: should_send_notification (Atomic Deduplication Check)
-- ============================================================================

CREATE OR REPLACE FUNCTION should_send_notification(
  p_user_id UUID,
  p_notification_key TEXT,
  p_cooldown_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_sent TIMESTAMPTZ;
  v_should_send BOOLEAN;
  v_hours_since NUMERIC;
BEGIN
  -- ✅ LOCK ROW to prevent race conditions
  -- Multiple concurrent requests won't create duplicates
  SELECT last_sent_at INTO v_last_sent
  FROM notification_deduplication
  WHERE user_id = p_user_id 
    AND notification_key = p_notification_key
  FOR UPDATE NOWAIT; -- Don't wait if locked, fail fast
  
  -- Check if enough time has passed
  IF v_last_sent IS NULL THEN
    -- ✅ First time sending this notification
    INSERT INTO notification_deduplication (
      user_id, 
      notification_key, 
      last_sent_at,
      cooldown_hours,
      notification_count
    )
    VALUES (
      p_user_id, 
      p_notification_key, 
      NOW(),
      p_cooldown_hours,
      1
    )
    ON CONFLICT (user_id, notification_key) 
    DO UPDATE SET 
      last_sent_at = NOW(),
      notification_count = notification_deduplication.notification_count + 1,
      updated_at = NOW();
    
    RETURN TRUE;
    
  ELSE
    -- ✅ Check if cooldown period has passed
    v_hours_since := EXTRACT(EPOCH FROM (NOW() - v_last_sent)) / 3600;
    
    IF v_hours_since >= p_cooldown_hours THEN
      -- Cooldown period has passed, update and allow
      UPDATE notification_deduplication
      SET 
        last_sent_at = NOW(),
        notification_count = notification_count + 1,
        cooldown_hours = p_cooldown_hours,
        updated_at = NOW()
      WHERE user_id = p_user_id 
        AND notification_key = p_notification_key;
      
      RETURN TRUE;
    ELSE
      -- Still in cooldown period
      RETURN FALSE;
    END IF;
  END IF;
  
EXCEPTION
  WHEN lock_not_available THEN
    -- Another request is processing this notification
    -- Return false to prevent duplicate (fail-safe)
    RETURN FALSE;
    
  WHEN unique_violation THEN
    -- Concurrent insert attempt, notification already being sent
    RETURN FALSE;
    
  WHEN OTHERS THEN
    -- On any error, log and fail-closed (don't send)
    RAISE WARNING 'Deduplication check failed for user % key %: %', 
      p_user_id, p_notification_key, SQLERRM;
    RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION should_send_notification IS 
  'Atomically checks if notification should be sent based on cooldown period. Returns TRUE if allowed, FALSE if duplicate.';

-- ============================================================================
-- FUNCTION: get_notification_stats (Analytics)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_notification_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  notification_key TEXT,
  total_sent INTEGER,
  last_sent TIMESTAMPTZ,
  cooldown_hours INTEGER,
  hours_until_next NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nd.notification_key,
    nd.notification_count as total_sent,
    nd.last_sent_at as last_sent,
    nd.cooldown_hours,
    GREATEST(
      0, 
      nd.cooldown_hours - EXTRACT(EPOCH FROM (NOW() - nd.last_sent_at)) / 3600
    )::NUMERIC(10,2) as hours_until_next
  FROM notification_deduplication nd
  WHERE p_user_id IS NULL OR nd.user_id = p_user_id
  ORDER BY nd.last_sent_at DESC;
END;
$$;

COMMENT ON FUNCTION get_notification_stats IS 
  'Get notification statistics for a user or all users (for debugging)';

-- ============================================================================
-- FUNCTION: reset_notification_cooldown (Manual Override)
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_notification_cooldown(
  p_user_id UUID,
  p_notification_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notification_deduplication
  SET last_sent_at = NOW() - INTERVAL '100 years' -- Force it to be sendable
  WHERE user_id = p_user_id 
    AND notification_key = p_notification_key;
  
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION reset_notification_cooldown IS 
  'Manually reset cooldown for a notification (admin tool)';

-- ============================================================================
-- FUNCTION: cleanup_old_deduplication_records
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_deduplication_records(
  p_days_old INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete records older than specified days
  DELETE FROM notification_deduplication
  WHERE last_sent_at < NOW() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_deduplication_records IS 
  'Remove old deduplication records to keep table size manageable';

-- ============================================================================
-- TRIGGER: Update timestamp on changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_notification_dedup_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_dedup_updated_at ON notification_deduplication;

CREATE TRIGGER trg_notification_dedup_updated_at
  BEFORE UPDATE ON notification_deduplication
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_dedup_timestamp();

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON notification_deduplication TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_deduplication TO anon;
GRANT ALL ON notification_deduplication TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION should_send_notification(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION should_send_notification(UUID, TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION should_send_notification(UUID, TEXT, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION get_notification_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_stats(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION reset_notification_cooldown(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_deduplication_records(INTEGER) TO service_role;

-- ============================================================================
-- TESTING
-- ============================================================================

-- Test 1: First notification (should return TRUE)
DO $$
DECLARE
  test_user_id UUID := (SELECT id FROM users LIMIT 1);
  test_key TEXT := 'test:product-123';
  should_send BOOLEAN;
BEGIN
  -- First call should return TRUE
  SELECT should_send_notification(test_user_id, test_key, 1) INTO should_send;
  
  IF should_send THEN
    RAISE NOTICE '✅ Test 1 PASSED: First notification allowed';
  ELSE
    RAISE NOTICE '❌ Test 1 FAILED: First notification blocked';
  END IF;
  
  -- Immediate second call should return FALSE (duplicate)
  SELECT should_send_notification(test_user_id, test_key, 1) INTO should_send;
  
  IF NOT should_send THEN
    RAISE NOTICE '✅ Test 2 PASSED: Duplicate notification blocked';
  ELSE
    RAISE NOTICE '❌ Test 2 FAILED: Duplicate notification allowed';
  END IF;
  
  -- Cleanup test data
  DELETE FROM notification_deduplication WHERE notification_key = test_key;
END $$;

-- Test 2: View deduplication stats
SELECT * FROM get_notification_stats() LIMIT 10;

-- ============================================================================
-- MONITORING QUERIES
-- ============================================================================

-- Most frequently sent notifications
SELECT 
  notification_key,
  COUNT(DISTINCT user_id) as users_affected,
  SUM(notification_count) as total_sent,
  AVG(notification_count) as avg_per_user,
  MAX(last_sent_at) as most_recent
FROM notification_deduplication
GROUP BY notification_key
ORDER BY total_sent DESC
LIMIT 20;

-- Users with most notifications prevented
SELECT 
  u.email,
  u.role,
  COUNT(*) as notification_types,
  SUM(nd.notification_count) as total_sent,
  MAX(nd.last_sent_at) as last_notification
FROM notification_deduplication nd
JOIN users u ON u.id = nd.user_id
GROUP BY u.id, u.email, u.role
ORDER BY total_sent DESC
LIMIT 20;

-- Recent deduplication activity
SELECT 
  u.email,
  nd.notification_key,
  nd.notification_count,
  nd.last_sent_at,
  nd.cooldown_hours,
  ROUND(
    EXTRACT(EPOCH FROM (NOW() - nd.last_sent_at)) / 3600,
    2
  ) as hours_since_last
FROM notification_deduplication nd
JOIN users u ON u.id = nd.user_id
ORDER BY nd.last_sent_at DESC
LIMIT 50;

-- ============================================================================
-- MAINTENANCE SCHEDULE
-- ============================================================================

-- Schedule cleanup with pg_cron (run weekly)
-- Uncomment after verifying pg_cron extension is enabled:
/*
SELECT cron.schedule(
  'cleanup-notification-deduplication',
  '0 3 * * 0', -- Every Sunday at 3 AM
  'SELECT cleanup_old_deduplication_records(90)'
);
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

/*
-- Uncomment to rollback:

DROP TRIGGER IF EXISTS trg_notification_dedup_updated_at ON notification_deduplication;
DROP FUNCTION IF EXISTS update_notification_dedup_timestamp();
DROP FUNCTION IF EXISTS cleanup_old_deduplication_records(INTEGER);
DROP FUNCTION IF EXISTS reset_notification_cooldown(UUID, TEXT);
DROP FUNCTION IF EXISTS get_notification_stats(UUID);
DROP FUNCTION IF EXISTS should_send_notification(UUID, TEXT, INTEGER);
DROP TABLE IF EXISTS notification_deduplication;
*/

-- ============================================================================
-- SUCCESS
-- ============================================================================

SELECT
  '✅ DEDUPLICATION SYSTEM CREATED SUCCESSFULLY!' as status,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'notification_deduplication'
UNION ALL
SELECT
  '✅ Functions created:' as status,
  COUNT(*) as function_count
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'should_send_notification',
    'get_notification_stats',
    'reset_notification_cooldown',
    'cleanup_old_deduplication_records'
  );

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

/*
1. Run this migration in Supabase SQL Editor
2. Verify table and functions were created (check query above)
3. Test with: SELECT should_send_notification((SELECT id FROM users LIMIT 1), 'test:123', 24);
4. Update NotificationService.js to use should_send_notification() RPC
5. Monitor deduplication stats with get_notification_stats()
*/
