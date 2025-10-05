-- ============================================================================
-- MedCure Notification System - Database Migration
-- ============================================================================
-- Description: Production-ready notification system with proper indexing and RLS
-- Version: 1.0
-- Date: October 5, 2025
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Enhance user_notifications table
-- ============================================================================

-- Add new columns if they don't exist
ALTER TABLE user_notifications 
  ADD COLUMN IF NOT EXISTS priority integer DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  ADD COLUMN IF NOT EXISTS category varchar(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS dismissed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamp with time zone;

-- Add comments for documentation
COMMENT ON COLUMN user_notifications.priority IS 'Priority level: 1=Critical (email), 2=High (email), 3=Medium, 4=Low, 5=Info';
COMMENT ON COLUMN user_notifications.category IS 'Category: inventory, expiry, sales, system, general';
COMMENT ON COLUMN user_notifications.dismissed_at IS 'Timestamp when notification was dismissed (soft delete)';
COMMENT ON COLUMN user_notifications.email_sent IS 'Whether email notification was sent';
COMMENT ON COLUMN user_notifications.email_sent_at IS 'Timestamp when email was sent';

-- ============================================================================
-- STEP 2: Create performance indexes
-- ============================================================================

-- Index for active notifications query (most common query)
CREATE INDEX IF NOT EXISTS idx_user_notif_active 
  ON user_notifications(user_id, is_read, created_at DESC)
  WHERE dismissed_at IS NULL;

-- Index for unread count query
CREATE INDEX IF NOT EXISTS idx_user_notif_unread_count 
  ON user_notifications(user_id)
  WHERE is_read = false AND dismissed_at IS NULL;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_user_notif_category
  ON user_notifications(user_id, category, created_at DESC)
  WHERE dismissed_at IS NULL;

-- Index for priority filtering (critical notifications)
CREATE INDEX IF NOT EXISTS idx_user_notif_priority
  ON user_notifications(user_id, priority, created_at DESC)
  WHERE dismissed_at IS NULL AND priority <= 2;

-- GIN index for metadata JSONB queries
CREATE INDEX IF NOT EXISTS idx_user_notif_metadata
  ON user_notifications USING GIN (metadata);

-- ============================================================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users see own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON user_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON user_notifications;
DROP POLICY IF EXISTS "Admins manage all notifications" ON user_notifications;

-- Policy: Users can only view their own notifications
CREATE POLICY "Users see own notifications" 
  ON user_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only update their own notifications (mark as read, dismiss)
CREATE POLICY "Users update own notifications" 
  ON user_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: System/service role can insert notifications for any user
CREATE POLICY "System can insert notifications" 
  ON user_notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can manage all notifications (for monitoring/debugging)
CREATE POLICY "Admins manage all notifications" 
  ON user_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.is_active = true
    )
  );

-- ============================================================================
-- STEP 4: Create helper functions
-- ============================================================================

-- Drop existing function if it exists (handles function overloading conflicts)
DROP FUNCTION IF EXISTS get_unread_notification_count(uuid);
DROP FUNCTION IF EXISTS get_unread_notification_count();

-- Function: Get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM user_notifications
  WHERE user_id = p_user_id
    AND is_read = false
    AND dismissed_at IS NULL;
$$;

COMMENT ON FUNCTION get_unread_notification_count IS 'Fast count of unread notifications for a user';

-- Drop existing cleanup function if it exists (handles function overloading conflicts)
DROP FUNCTION IF EXISTS cleanup_old_notifications(integer);
DROP FUNCTION IF EXISTS cleanup_old_notifications();

-- Function: Clean up old dismissed notifications (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM user_notifications
  WHERE dismissed_at IS NOT NULL
    AND dismissed_at < NOW() - (days_old || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_notifications IS 'Delete dismissed notifications older than specified days (default 30)';

-- ============================================================================
-- STEP 5: Create notification statistics view
-- ============================================================================

CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false AND dismissed_at IS NULL) as unread_count,
  COUNT(*) FILTER (WHERE is_read = true) as read_count,
  COUNT(*) FILTER (WHERE dismissed_at IS NOT NULL) as dismissed_count,
  COUNT(*) FILTER (WHERE priority <= 2) as critical_count,
  COUNT(*) FILTER (WHERE email_sent = true) as email_sent_count,
  MAX(created_at) as last_notification_at,
  MIN(created_at) FILTER (WHERE is_read = false AND dismissed_at IS NULL) as oldest_unread_at
FROM user_notifications
GROUP BY user_id;

COMMENT ON VIEW notification_stats IS 'Summary statistics for user notifications';

-- ============================================================================
-- STEP 6: Drop unused/redundant tables
-- ============================================================================

-- These tables are not being used in the new system
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_rules CASCADE;
DROP TABLE IF EXISTS email_queue CASCADE;

-- ============================================================================
-- STEP 7: Create trigger for automatic timestamp updates
-- ============================================================================

CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_notifications_timestamp ON user_notifications;

CREATE TRIGGER update_user_notifications_timestamp
  BEFORE UPDATE ON user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

-- ============================================================================
-- STEP 8: Grant necessary permissions
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, UPDATE ON user_notifications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;

-- Service role can do everything (for backend operations)
GRANT ALL ON user_notifications TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

COMMIT;

-- ============================================================================
-- Verification queries (run these after migration)
-- ============================================================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_notifications' 
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'user_notifications';

-- Check RLS policies
-- SELECT policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'user_notifications';

-- Test unread count function
-- SELECT get_unread_notification_count('your-user-id-here');

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Notification system migration completed successfully!';
  RAISE NOTICE '📊 Table: user_notifications enhanced with priority, category, dismissal';
  RAISE NOTICE '⚡ Indexes: Created 5 performance indexes';
  RAISE NOTICE '🔒 Security: RLS policies enabled and configured';
  RAISE NOTICE '🛠️ Functions: Helper functions created';
  RAISE NOTICE '🧹 Cleanup: Unused tables dropped';
END $$;
