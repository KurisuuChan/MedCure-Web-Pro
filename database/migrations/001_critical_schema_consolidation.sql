-- =====================================================
-- CRITICAL SCHEMA CONSOLIDATION MIGRATION
-- =====================================================
-- This migration fixes the duplicate user tables and broken foreign keys
-- identified in the comprehensive system analysis.
-- 
-- CRITICAL ISSUES BEING FIXED:
-- 1. Duplicate users/user_profiles tables causing 11 broken FK references
-- 2. Duplicate batch_inventory/batches tables with inconsistent field names
-- 3. Role system mismatch (3-tier vs 6-tier)
-- 4. Orphaned data and referential integrity violations
-- =====================================================

BEGIN;

-- =====================================================
-- PHASE 1: SAFETY BACKUPS
-- =====================================================

-- Create backup tables for rollback safety
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS batch_inventory_backup AS SELECT * FROM batch_inventory;
CREATE TABLE IF NOT EXISTS products_backup AS SELECT * FROM products;
CREATE TABLE IF NOT EXISTS sales_backup AS SELECT * FROM sales;
CREATE TABLE IF NOT EXISTS audit_log_backup AS SELECT * FROM audit_log;
CREATE TABLE IF NOT EXISTS stock_movements_backup AS SELECT * FROM stock_movements;

-- Log migration start
INSERT INTO audit_log (
    table_name, operation, record_id, new_values, 
    user_role, timestamp, ip_address
) VALUES (
    'migration', 'SCHEMA_CONSOLIDATION_START', 
    gen_random_uuid(), 
    '{"migration": "001_critical_schema_consolidation", "phase": "backup_complete"}',
    'system', NOW(), '127.0.0.1'
);

-- =====================================================
-- PHASE 2: USER TABLES CONSOLIDATION
-- =====================================================

-- Step 1: Migrate all users to user_profiles with proper status mapping
INSERT INTO user_profiles (
    id, email, first_name, last_name, phone, department,
    status, created_at, updated_at, last_login, login_count
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.first_name, 'Unknown') as first_name,
    COALESCE(u.last_name, 'User') as last_name,
    u.phone,
    CASE 
        WHEN u.role = 'admin' THEN 'Administration'
        WHEN u.role = 'manager' THEN 'Management'
        WHEN u.role = 'cashier' THEN 'Pharmacy'
        ELSE 'General'
    END as department,
    CASE WHEN u.is_active THEN 'active' ELSE 'inactive' END as status,
    u.created_at,
    u.updated_at,
    u.last_login,
    0 as login_count
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.id = u.id
);

-- Step 2: Create proper role mappings in user_roles table
INSERT INTO user_roles (user_id, role, assigned_at, is_active)
SELECT 
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 'super_admin'
        WHEN u.role = 'manager' THEN 'manager'
        WHEN u.role = 'cashier' THEN 'pharmacist'
        ELSE 'staff'
    END as role,
    u.created_at as assigned_at,
    u.is_active
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
);

-- =====================================================
-- PHASE 3: FIX BROKEN FOREIGN KEY REFERENCES
-- =====================================================

-- Step 3: Fix products.archived_by references
UPDATE products 
SET archived_by = CASE 
    WHEN archived_by IS NOT NULL AND EXISTS (SELECT 1 FROM user_profiles WHERE id = products.archived_by) 
    THEN archived_by
    ELSE NULL
END;

-- Step 4: Fix audit_log.user_id references
UPDATE audit_log 
SET user_id = CASE 
    WHEN user_id IS NOT NULL AND EXISTS (SELECT 1 FROM user_profiles WHERE id = audit_log.user_id)
    THEN user_id
    ELSE NULL
END;

-- Step 5: Fix sales.user_id references by matching emails
UPDATE sales 
SET user_id = (
    SELECT up.id 
    FROM user_profiles up 
    INNER JOIN users u ON u.email = up.email 
    WHERE u.id = sales.user_id
    LIMIT 1
)
WHERE user_id IN (SELECT id FROM users)
  AND user_id NOT IN (SELECT id FROM user_profiles);

-- Step 6: Fix stock_movements.user_id references
UPDATE stock_movements 
SET user_id = (
    SELECT up.id 
    FROM user_profiles up 
    INNER JOIN users u ON u.email = up.email 
    WHERE u.id = stock_movements.user_id
    LIMIT 1
)
WHERE user_id IN (SELECT id FROM users)
  AND user_id NOT IN (SELECT id FROM user_profiles);

-- =====================================================
-- PHASE 4: BATCH TABLES CONSOLIDATION
-- =====================================================

-- Step 7: Migrate batch_inventory to batches with field name mapping
INSERT INTO batches (
    id, product_id, batch_number, expiration_date, quantity, 
    original_quantity, cost_price, supplier, status, 
    created_at, updated_at, created_by
)
SELECT 
    bi.id,
    bi.product_id,
    bi.batch_number,
    bi.expiry_date as expiration_date,  -- Field name mapping
    bi.stock_quantity as quantity,
    bi.stock_quantity as original_quantity,
    bi.cost_price,
    bi.supplier,
    CASE WHEN bi.is_active THEN 'active' ELSE 'inactive' END as status,
    bi.created_at,
    bi.updated_at,
    NULL as created_by  -- Will be updated later if needed
FROM batch_inventory bi
WHERE NOT EXISTS (
    SELECT 1 FROM batches b WHERE b.id = bi.id
);

-- Step 8: Update sale_items batch references
UPDATE sale_items 
SET batch_id = CASE 
    WHEN batch_id IS NOT NULL AND EXISTS (SELECT 1 FROM batches WHERE id = sale_items.batch_id)
    THEN batch_id
    ELSE NULL  -- Set to NULL for now, can be updated later with proper batch tracking
END;

-- Step 9: Update expired_products_clearance batch references
UPDATE expired_products_clearance 
SET batch_id = (
    SELECT b.id 
    FROM batches b 
    INNER JOIN batch_inventory bi ON bi.batch_number = b.batch_number 
        AND bi.product_id = b.product_id
    WHERE bi.id = expired_products_clearance.batch_id
    LIMIT 1
)
WHERE batch_id IS NOT NULL;

-- =====================================================
-- PHASE 5: DROP CONSTRAINTS AND DEPRECATED TABLES
-- =====================================================

-- Step 10: Drop foreign key constraints that reference deprecated tables
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_archived_by_fkey;
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_user_id_fkey;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_edited_by_fkey;
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_user_id_fkey;
ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_batch_id_fkey;
ALTER TABLE expired_products_clearance DROP CONSTRAINT IF EXISTS expired_products_clearance_batch_id_fkey;

-- Step 11: Drop the deprecated tables
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS batch_inventory CASCADE;

-- =====================================================
-- PHASE 6: ADD CORRECT FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Step 12: Add proper foreign key constraints
ALTER TABLE products 
ADD CONSTRAINT products_archived_by_fkey 
FOREIGN KEY (archived_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE audit_log 
ADD CONSTRAINT audit_log_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE sales 
ADD CONSTRAINT sales_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE RESTRICT;

ALTER TABLE sales 
ADD CONSTRAINT sales_edited_by_fkey 
FOREIGN KEY (edited_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE stock_movements 
ADD CONSTRAINT stock_movements_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE RESTRICT;

ALTER TABLE sale_items 
ADD CONSTRAINT sale_items_batch_id_fkey 
FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL;

ALTER TABLE disposal_items 
DROP CONSTRAINT IF EXISTS disposal_items_batch_id_fkey;
ALTER TABLE disposal_items 
ADD CONSTRAINT disposal_items_batch_id_fkey 
FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE RESTRICT;

-- =====================================================
-- PHASE 7: VERIFICATION AND VALIDATION
-- =====================================================

-- Create verification view
CREATE OR REPLACE VIEW migration_verification AS
SELECT 
    'user_profiles_migrated' as metric, 
    COUNT(*) as count 
FROM user_profiles
UNION ALL
SELECT 
    'user_roles_created' as metric, 
    COUNT(*) as count 
FROM user_roles
UNION ALL
SELECT 
    'batches_migrated' as metric, 
    COUNT(*) as count 
FROM batches
UNION ALL
SELECT 
    'orphaned_products_archived_by' as metric, 
    COUNT(*) as count 
FROM products 
WHERE archived_by IS NOT NULL 
  AND archived_by NOT IN (SELECT id FROM user_profiles)
UNION ALL
SELECT 
    'orphaned_sales_user_id' as metric, 
    COUNT(*) as count 
FROM sales 
WHERE user_id NOT IN (SELECT id FROM user_profiles)
UNION ALL
SELECT 
    'orphaned_stock_movements' as metric, 
    COUNT(*) as count 
FROM stock_movements 
WHERE user_id NOT IN (SELECT id FROM user_profiles)
UNION ALL
SELECT 
    'orphaned_sale_items_batch' as metric, 
    COUNT(*) as count 
FROM sale_items 
WHERE batch_id IS NOT NULL 
  AND batch_id NOT IN (SELECT id FROM batches);

-- Log migration completion
INSERT INTO audit_log (
    table_name, operation, record_id, new_values, 
    user_role, timestamp, ip_address
) VALUES (
    'migration', 'SCHEMA_CONSOLIDATION_COMPLETE', 
    gen_random_uuid(), 
    '{"migration": "001_critical_schema_consolidation", "phase": "completed", "status": "success"}',
    'system', NOW(), '127.0.0.1'
);

COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- =====================================================

-- Run these queries after migration to verify success:
-- SELECT * FROM migration_verification ORDER BY metric;

-- Check for any remaining foreign key violations:
-- SELECT 'products' as table_name, COUNT(*) as violations 
-- FROM products WHERE archived_by IS NOT NULL AND archived_by NOT IN (SELECT id FROM user_profiles)
-- UNION ALL
-- SELECT 'sales' as table_name, COUNT(*) as violations 
-- FROM sales WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =====================================================

-- If migration needs to be rolled back:
-- 1. DROP the new foreign key constraints
-- 2. RESTORE from backup tables: users_backup, batch_inventory_backup
-- 3. DROP the migrated data from user_profiles and batches
-- 4. RESTORE original foreign key constraints

-- Example rollback (DO NOT RUN unless necessary):
/*
BEGIN;
-- Restore users table
CREATE TABLE users AS SELECT * FROM users_backup;
-- Restore batch_inventory table  
CREATE TABLE batch_inventory AS SELECT * FROM batch_inventory_backup;
-- Clean up migrated data
DELETE FROM user_profiles WHERE id IN (SELECT id FROM users_backup);
DELETE FROM batches WHERE id IN (SELECT id FROM batch_inventory_backup);
COMMIT;
*/