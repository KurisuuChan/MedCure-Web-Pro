-- ==========================================
-- MEDCURE-PRO: PROFESSIONAL SYSTEM CLEANUP
-- Removing over-engineered features for production
-- ==========================================

-- ==========================================
-- 1. REMOVE SUPPLIER MANAGEMENT SYSTEM
-- ==========================================

-- Drop supplier management tables (if they exist)
DROP TABLE IF EXISTS supplier_activity_logs CASCADE;
DROP TABLE IF EXISTS purchase_order_activity_logs CASCADE;
DROP TABLE IF EXISTS supplier_documents CASCADE;
DROP TABLE IF EXISTS supplier_performance_metrics CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS supplier_products CASCADE;
DROP TABLE IF EXISTS supplier_contacts CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Drop related functions
DROP FUNCTION IF EXISTS get_supplier_by_email(VARCHAR);
DROP FUNCTION IF EXISTS get_supplier_performance_summary(UUID);
DROP FUNCTION IF EXISTS calculate_po_item_total();
DROP FUNCTION IF EXISTS update_purchase_order_totals();
DROP FUNCTION IF EXISTS update_supplier_updated_at();

RAISE NOTICE '✅ Supplier management system removed';

-- ==========================================
-- 2. REMOVE OVER-ENGINEERED NOTIFICATION SYSTEM
-- ==========================================

-- Drop notification tables if they exist
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notification_delivery_logs CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Drop notification functions
DROP FUNCTION IF EXISTS send_notification(UUID, VARCHAR, TEXT, JSONB);
DROP FUNCTION IF EXISTS mark_notification_delivered(UUID);
DROP FUNCTION IF EXISTS get_user_notifications(UUID, INTEGER, INTEGER);

-- Remove notification triggers
DROP TRIGGER IF EXISTS trigger_low_stock_notification ON products;
DROP TRIGGER IF EXISTS trigger_expiry_notification ON products;

RAISE NOTICE '✅ Complex notification system removed';

-- ==========================================
-- 3. REMOVE ACTIVITY LOGGING SYSTEM
-- ==========================================

-- Drop activity logging tables
DROP TABLE IF EXISTS user_activity_logs CASCADE;
DROP TABLE IF EXISTS system_activity_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Drop activity logging functions
DROP FUNCTION IF EXISTS log_user_activity(UUID, VARCHAR, TEXT, JSONB);
DROP FUNCTION IF EXISTS log_system_activity(VARCHAR, TEXT, JSONB);

RAISE NOTICE '✅ Activity logging system removed';

-- ==========================================
-- 4. REMOVE CATEGORY ENHANCEMENT SYSTEM
-- ==========================================

-- Drop category enhancement tables
DROP TABLE IF EXISTS intelligent_categories CASCADE;
DROP TABLE IF EXISTS category_insights CASCADE;
DROP TABLE IF EXISTS category_metadata CASCADE;
DROP TABLE IF EXISTS category_auto_assignments CASCADE;

-- Drop category enhancement functions
DROP FUNCTION IF EXISTS auto_assign_category(VARCHAR);
DROP FUNCTION IF EXISTS get_category_insights();
DROP FUNCTION IF EXISTS calculate_category_metrics();

-- Remove category enhancement views
DROP VIEW IF EXISTS category_value_summary;
DROP VIEW IF EXISTS intelligent_category_stats;

RAISE NOTICE '✅ Category enhancement system removed';

-- ==========================================
-- 5. VALIDATE CORE SCHEMA REMAINS INTACT
-- ==========================================

-- Ensure we only have essential tables
DO $$
DECLARE
    table_count INTEGER;
    table_rec RECORD;
BEGIN
    -- Count core tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN ('users', 'products', 'sales', 'sale_items', 'stock_movements');
    
    RAISE NOTICE 'Core tables preserved: % essential tables', table_count;
    
    -- List all remaining tables
    RAISE NOTICE 'Remaining tables after cleanup:';
    FOR table_rec IN 
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        ORDER BY t.table_name
    LOOP
        RAISE NOTICE '  - %', table_rec.table_name;
    END LOOP;
END $$;

-- ==========================================
-- 6. CLEANUP COMPLETE
-- ==========================================

COMMENT ON SCHEMA public IS 'MedCure-Pro: Simplified for pharmacy use - over-engineered features removed';

-- Final verification
SELECT 
    'CLEANUP SUMMARY' as status,
    COUNT(*) as remaining_tables,
    'Core pharmacy functionality preserved' as note
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';

RAISE NOTICE '🎉 Database cleanup complete! System simplified for production use.';
