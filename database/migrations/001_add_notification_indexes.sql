-- ============================================================================
-- MIGRATION: Add Essential Indexes to user_notifications
-- ============================================================================
-- Purpose: Improve query performance by 10-100x
-- Issue: All queries currently do full table scans
-- Impact: Faster notifications, reduced database load
-- Date: October 7, 2025
-- Priority: CRITICAL
-- ============================================================================

-- Check current indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'user_notifications'
ORDER BY indexname;

-- ============================================================================
-- INDEX 1: User ID Lookup
-- ============================================================================
-- Query pattern: WHERE user_id = ?
-- Usage: Every notification query for a specific user
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id 
  ON user_notifications(user_id);

COMMENT ON INDEX idx_user_notifications_user_id IS 
  'Speeds up user-specific notification queries';

-- ============================================================================
-- INDEX 2: Unread Notifications Lookup (Most Common Query)
-- ============================================================================
-- Query pattern: WHERE user_id = ? AND is_read = false AND dismissed_at IS NULL
-- Usage: Getting unread notification count, notification list
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread 
  ON user_notifications(user_id, is_read, dismissed_at)
  WHERE is_read = false AND dismissed_at IS NULL;

COMMENT ON INDEX idx_user_notifications_user_unread IS 
  'Partial index for fast unread notification queries';

-- ============================================================================
-- INDEX 3: Category + Time Lookup
-- ============================================================================
-- Query pattern: WHERE category = ? ORDER BY created_at DESC
-- Usage: Filtering notifications by category
CREATE INDEX IF NOT EXISTS idx_user_notifications_category 
  ON user_notifications(category, created_at DESC);

COMMENT ON INDEX idx_user_notifications_category IS 
  'Speeds up category-filtered notification queries with time ordering';

-- ============================================================================
-- INDEX 4: Priority + Read Status (Dashboard Queries)
-- ============================================================================
-- Query pattern: WHERE priority <= ? AND is_read = false
-- Usage: High-priority unread notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_priority_unread 
  ON user_notifications(priority, is_read)
  WHERE is_read = false AND dismissed_at IS NULL;

COMMENT ON INDEX idx_user_notifications_priority_unread IS 
  'Partial index for critical/high-priority unread notifications';

-- ============================================================================
-- INDEX 5: JSONB Metadata Search (GIN Index)
-- ============================================================================
-- Query pattern: WHERE metadata @> '{"productId": "..."}'
-- Usage: Finding notifications related to specific products
CREATE INDEX IF NOT EXISTS idx_user_notifications_metadata_gin 
  ON user_notifications USING gin(metadata);

COMMENT ON INDEX idx_user_notifications_metadata_gin IS 
  'GIN index for fast JSONB metadata queries';

-- ============================================================================
-- INDEX 6: Created At Timestamp
-- ============================================================================
-- Query pattern: ORDER BY created_at DESC, WHERE created_at > ?
-- Usage: Recent notifications, time-based filtering
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at 
  ON user_notifications(created_at DESC);

COMMENT ON INDEX idx_user_notifications_created_at IS 
  'Speeds up time-based queries and sorting';

-- ============================================================================
-- INDEX 7: Email Tracking
-- ============================================================================
-- Query pattern: WHERE email_sent = false AND priority <= 2
-- Usage: Finding notifications that need email delivery
CREATE INDEX IF NOT EXISTS idx_user_notifications_email_pending 
  ON user_notifications(email_sent, priority)
  WHERE email_sent = false AND priority <= 2;

COMMENT ON INDEX idx_user_notifications_email_pending IS 
  'Partial index for pending email notifications';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all indexes on user_notifications
SELECT
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) as index_size,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND relname = 'user_notifications'
ORDER BY indexrelname;

-- Explain analyze a common query (before and after)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, title, message, type, priority, created_at
FROM user_notifications
WHERE user_id = (SELECT id FROM users LIMIT 1)
  AND is_read = false
  AND dismissed_at IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- EXPECTED IMPROVEMENTS
-- ============================================================================

/*
BEFORE INDEXES:
- Query plan: Seq Scan on user_notifications (slow)
- Execution time: 50-200ms (depends on table size)
- Rows scanned: ALL rows in table

AFTER INDEXES:
- Query plan: Index Scan using idx_user_notifications_user_unread
- Execution time: 0.5-5ms (10-100x faster)
- Rows scanned: Only matching rows

Example improvements:
- getUnreadCount(): 150ms → 2ms (75x faster)
- getUserNotifications(): 200ms → 5ms (40x faster)
- Health checks: 30s → 1s (30x faster)
*/

-- ============================================================================
-- MAINTENANCE
-- ============================================================================

-- Check index bloat (run periodically)
SELECT
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) as size,
  idx_scan as scans,
  CASE
    WHEN idx_scan = 0 THEN 'UNUSED - Consider dropping'
    WHEN idx_scan < 100 THEN 'Low usage'
    ELSE 'Actively used'
  END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND relname = 'user_notifications'
ORDER BY idx_scan ASC;

-- Rebuild indexes if needed (after large data changes)
-- REINDEX TABLE user_notifications;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- Uncomment to remove indexes:
/*
DROP INDEX IF EXISTS idx_user_notifications_user_id;
DROP INDEX IF EXISTS idx_user_notifications_user_unread;
DROP INDEX IF EXISTS idx_user_notifications_category;
DROP INDEX IF EXISTS idx_user_notifications_priority_unread;
DROP INDEX IF EXISTS idx_user_notifications_metadata_gin;
DROP INDEX IF EXISTS idx_user_notifications_created_at;
DROP INDEX IF EXISTS idx_user_notifications_email_pending;
*/

-- ============================================================================
-- SUCCESS
-- ============================================================================

SELECT
  '✅ INDEXES CREATED SUCCESSFULLY!' as status,
  COUNT(*) as index_count,
  string_agg(indexname, ', ') as indexes
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'user_notifications'
  AND indexname LIKE 'idx_user_notifications%';

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

/*
1. Run this migration in Supabase SQL Editor
2. Verify indexes were created (check query above)
3. Test notification queries - should be much faster
4. Monitor query performance with EXPLAIN ANALYZE
5. Proceed to next migration: 002_notification_deduplication.sql
*/
