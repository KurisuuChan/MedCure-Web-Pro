-- ============================================================================
-- DATABASE CLEANUP - Remove Duplicate and Unused Tables
-- ============================================================================
-- This script removes duplicate notification systems and unused tables
-- 
-- WHAT THIS DOES:
-- 1. Removes duplicate user notification/profile tables (using user_notifications now)
-- 2. Removes old batch tracking tables (using batches table now)
-- 3. Removes unused audit and permission tables
-- 4. Keeps only the active, production-ready tables
--
-- RUN THIS AFTER BACKING UP YOUR DATABASE
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: BACKUP CHECK
-- ============================================================================
-- Before running this, make sure you have a backup!
-- In Supabase: Settings > Database > Backups

DO $$
BEGIN
    RAISE NOTICE '⚠️  WARNING: This will delete duplicate and unused tables!';
    RAISE NOTICE '✅ Make sure you have a database backup before proceeding.';
    RAISE NOTICE '📋 Tables to be removed:';
    RAISE NOTICE '   - user_profiles (duplicate of users table)';
    RAISE NOTICE '   - user_roles (using users.role column instead)';
    RAISE NOTICE '   - user_permissions (not currently used)';
    RAISE NOTICE '   - user_preferences (not currently used)';
    RAISE NOTICE '   - user_sessions (not currently used)';
    RAISE NOTICE '   - password_reset_tokens (handled by Supabase Auth)';
    RAISE NOTICE '   - login_attempts (not currently used)';
    RAISE NOTICE '   - batch_inventory (using batches table instead)';
    RAISE NOTICE '   - product_batches (using batches table instead)';
    RAISE NOTICE '   - expired_products_clearance (using disposal_records instead)';
    RAISE NOTICE '   - audit_log (not currently implemented)';
END $$;

-- ============================================================================
-- SECTION 2: DROP FOREIGN KEY CONSTRAINTS FIRST
-- ============================================================================
-- Must remove foreign keys before dropping tables

-- Drop constraints on user_notifications
ALTER TABLE IF EXISTS user_notifications 
    DROP CONSTRAINT IF EXISTS user_notifications_user_id_fkey;

-- Drop constraints on user-related tables
ALTER TABLE IF EXISTS user_roles 
    DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
    DROP CONSTRAINT IF EXISTS user_roles_assigned_by_fkey;

ALTER TABLE IF EXISTS user_permissions 
    DROP CONSTRAINT IF EXISTS user_permissions_user_id_fkey,
    DROP CONSTRAINT IF EXISTS user_permissions_granted_by_fkey;

ALTER TABLE IF EXISTS user_preferences 
    DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

ALTER TABLE IF EXISTS user_sessions 
    DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;

ALTER TABLE IF EXISTS password_reset_tokens 
    DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;

-- Drop constraints on batch-related tables
ALTER TABLE IF EXISTS sale_items 
    DROP CONSTRAINT IF EXISTS sale_items_batch_id_fkey;

ALTER TABLE IF EXISTS expired_products_clearance 
    DROP CONSTRAINT IF EXISTS expired_products_clearance_batch_id_fkey;

ALTER TABLE IF EXISTS inventory_logs 
    DROP CONSTRAINT IF EXISTS inventory_logs_batch_id_fkey;

-- ============================================================================
-- SECTION 3: RECONNECT user_notifications TO CORRECT TABLE
-- ============================================================================
-- user_notifications should reference 'users' table, not 'user_profiles'

ALTER TABLE user_notifications 
    ADD CONSTRAINT user_notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

RAISE NOTICE '✅ Reconnected user_notifications to users table';

-- ============================================================================
-- SECTION 4: DROP DUPLICATE USER MANAGEMENT TABLES
-- ============================================================================
-- These are duplicates - we're using the 'users' table instead

DROP TABLE IF EXISTS user_sessions CASCADE;
RAISE NOTICE '🗑️  Dropped: user_sessions (not used)';

DROP TABLE IF EXISTS user_preferences CASCADE;
RAISE NOTICE '🗑️  Dropped: user_preferences (not used)';

DROP TABLE IF EXISTS user_permissions CASCADE;
RAISE NOTICE '🗑️  Dropped: user_permissions (not used)';

DROP TABLE IF EXISTS user_roles CASCADE;
RAISE NOTICE '🗑️  Dropped: user_roles (using users.role instead)';

DROP TABLE IF EXISTS password_reset_tokens CASCADE;
RAISE NOTICE '🗑️  Dropped: password_reset_tokens (handled by Supabase Auth)';

DROP TABLE IF EXISTS login_attempts CASCADE;
RAISE NOTICE '🗑️  Dropped: login_attempts (not used)';

DROP TABLE IF EXISTS user_profiles CASCADE;
RAISE NOTICE '🗑️  Dropped: user_profiles (duplicate of users table)';

-- ============================================================================
-- SECTION 5: DROP DUPLICATE BATCH TRACKING TABLES
-- ============================================================================
-- We're using 'batches' table as the single source of truth

DROP TABLE IF EXISTS expired_products_clearance CASCADE;
RAISE NOTICE '🗑️  Dropped: expired_products_clearance (using disposal_records)';

DROP TABLE IF EXISTS product_batches CASCADE;
RAISE NOTICE '🗑️  Dropped: product_batches (using batches table)';

DROP TABLE IF EXISTS batch_inventory CASCADE;
RAISE NOTICE '🗑️  Dropped: batch_inventory (using batches table)';

-- ============================================================================
-- SECTION 6: DROP UNUSED AUDIT TABLE
-- ============================================================================

DROP TABLE IF EXISTS audit_log CASCADE;
RAISE NOTICE '🗑️  Dropped: audit_log (not currently implemented)';

-- ============================================================================
-- SECTION 7: UPDATE FOREIGN KEYS TO USE CORRECT TABLES
-- ============================================================================

-- Update sale_items to reference batches instead of batch_inventory
ALTER TABLE IF EXISTS sale_items 
    ADD CONSTRAINT sale_items_batch_id_fkey 
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL;

-- Update inventory_logs to reference batches
ALTER TABLE IF EXISTS inventory_logs 
    ADD CONSTRAINT inventory_logs_batch_id_fkey 
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL;

RAISE NOTICE '✅ Updated foreign keys to reference correct tables';

-- ============================================================================
-- SECTION 8: VERIFICATION
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    -- Count remaining tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE '📊 Database cleanup complete!';
    RAISE NOTICE '📋 Remaining tables: %', table_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ ACTIVE TABLES (Production-Ready):';
    RAISE NOTICE '   👥 User Management: users';
    RAISE NOTICE '   📦 Products: products, categories';
    RAISE NOTICE '   🏷️  Batches: batches (single source)';
    RAISE NOTICE '   💰 Sales: sales, sale_items';
    RAISE NOTICE '   📦 Inventory: stock_movements, inventory_logs';
    RAISE NOTICE '   🚮 Disposal: disposal_records, disposal_items, disposal_approvals';
    RAISE NOTICE '   🛒 Purchasing: purchase_orders, purchase_order_items';
    RAISE NOTICE '   📦 Suppliers: suppliers, product_suppliers';
    RAISE NOTICE '   👥 Customers: customers';
    RAISE NOTICE '   🔔 Notifications: user_notifications (database-backed)';
    RAISE NOTICE '   ⚙️  Settings: system_settings';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Your database is now clean and optimized!';
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- If something goes wrong, you can restore from backup:
-- 1. Go to Supabase Dashboard > Settings > Database > Backups
-- 2. Select the backup from before running this script
-- 3. Click "Restore"
--
-- Or run: ROLLBACK; (if you haven't committed yet)
-- ============================================================================
