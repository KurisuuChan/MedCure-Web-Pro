-- ==========================================
-- MEDCURE-PRO SCHEMA ALIGNMENT STRATEGY
-- ==========================================
-- Professional Database Schema Alignment for ML System Integration
-- 
-- CRITICAL ISSUE ANALYSIS:
-- The ML services expect 'pos_transactions' and 'pos_transaction_items' tables
-- but the actual database uses 'sales' and 'sale_items' tables.
-- 
-- RESOLUTION STRATEGY: Create Views + Gradual Migration
-- ==========================================

-- ==========================================
-- PHASE 1: IMMEDIATE FIX - CREATE COMPATIBILITY VIEWS
-- ==========================================
-- Create views to map existing tables to expected ML service names
-- This allows immediate ML system functionality without breaking changes

-- Create pos_transactions view mapping to sales table
CREATE OR REPLACE VIEW pos_transactions AS
SELECT 
    id,
    user_id,
    total_amount,
    tax_amount,
    payment_method,
    status,  -- This column exists in sales table
    notes,
    customer_name,
    customer_phone,
    created_at,
    updated_at
FROM sales;

-- Create pos_transaction_items view mapping to sale_items table
CREATE OR REPLACE VIEW pos_transaction_items AS
SELECT 
    id,
    sale_id as transaction_id,  -- Map sale_id to transaction_id for ML compatibility
    product_id,
    quantity,
    unit_type,
    unit_price,
    total_price,
    created_at
FROM sale_items;

-- ==========================================
-- PHASE 2: PRODUCTS TABLE STATUS COLUMN FIX
-- ==========================================
-- Add missing 'status' column that ML services expect
-- Keep 'is_active' for backward compatibility

-- Add status column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) 
CHECK (status IN ('active', 'inactive', 'discontinued', 'out_of_stock')) 
DEFAULT 'active';

-- Create function to sync status with is_active
CREATE OR REPLACE FUNCTION sync_product_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When is_active changes, update status accordingly
    IF TG_OP = 'UPDATE' AND OLD.is_active != NEW.is_active THEN
        IF NEW.is_active = TRUE THEN
            NEW.status := 'active';
        ELSE
            NEW.status := 'inactive';
        END IF;
    END IF;
    
    -- When status changes, update is_active accordingly
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        IF NEW.status = 'active' THEN
            NEW.is_active := TRUE;
        ELSE
            NEW.is_active := FALSE;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep status and is_active in sync
DROP TRIGGER IF EXISTS sync_product_status_trigger ON products;
CREATE TRIGGER sync_product_status_trigger
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION sync_product_status();

-- Initialize status column based on existing is_active values
UPDATE products 
SET status = CASE 
    WHEN is_active = TRUE THEN 'active'
    ELSE 'inactive'
END
WHERE status IS NULL;

-- ==========================================
-- PHASE 3: NOTIFICATIONS TABLE DELIVERY_STATUS FIX
-- ==========================================
-- Add missing delivery_status column for notification analytics

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) 
CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'read')) 
DEFAULT 'pending';

-- Initialize delivery_status based on existing data
UPDATE notifications 
SET delivery_status = CASE 
    WHEN read_at IS NOT NULL THEN 'read'
    WHEN created_at < NOW() - INTERVAL '1 hour' THEN 'delivered'
    ELSE 'sent'
END
WHERE delivery_status IS NULL;

-- ==========================================
-- PHASE 4: ENHANCED VIEW PERMISSIONS
-- ==========================================
-- Ensure ML services can access the compatibility views

-- Grant permissions on views to authenticated users
GRANT SELECT ON pos_transactions TO authenticated;
GRANT SELECT ON pos_transaction_items TO authenticated;

-- NOTE: Row Level Security cannot be enabled on views
-- Security is inherited from the underlying tables (sales and sale_items)
-- The views will respect the RLS policies already defined on the base tables

-- Ensure RLS is enabled on the underlying tables
-- (These should already be enabled from your main schema)
-- ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Views automatically inherit security from underlying tables
-- No additional RLS policies needed for views

-- ==========================================
-- PHASE 5: DATA VALIDATION FUNCTIONS
-- ==========================================
-- Create functions to validate schema alignment

CREATE OR REPLACE FUNCTION validate_schema_alignment()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check pos_transactions view
    RETURN QUERY
    SELECT 
        'pos_transactions_view'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'pos_transactions') 
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'View mapping sales to pos_transactions'::TEXT;
    
    -- Check pos_transaction_items view
    RETURN QUERY
    SELECT 
        'pos_transaction_items_view'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'pos_transaction_items') 
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'View mapping sale_items to pos_transaction_items'::TEXT;
    
    -- Check products.status column
    RETURN QUERY
    SELECT 
        'products_status_column'::TEXT,
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'status'
        ) THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Status column exists in products table'::TEXT;
    
    -- Check notifications.delivery_status column
    RETURN QUERY
    SELECT 
        'notifications_delivery_status_column'::TEXT,
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'delivery_status'
        ) THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Delivery_status column exists in notifications table'::TEXT;
    
    -- Check data consistency
    RETURN QUERY
    SELECT 
        'data_consistency'::TEXT,
        CASE WHEN (SELECT COUNT(*) FROM pos_transactions) = (SELECT COUNT(*) FROM sales)
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'View data matches underlying tables'::TEXT;
        
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PHASE 6: MIGRATION ROLLBACK PLAN
-- ==========================================
-- Create rollback procedures in case of issues

CREATE OR REPLACE FUNCTION rollback_schema_alignment()
RETURNS TEXT AS $$
BEGIN
    -- Drop views
    DROP VIEW IF EXISTS pos_transactions CASCADE;
    DROP VIEW IF EXISTS pos_transaction_items CASCADE;
    
    -- Remove added columns (optional - be careful with data loss)
    -- ALTER TABLE products DROP COLUMN IF EXISTS status;
    -- ALTER TABLE notifications DROP COLUMN IF EXISTS delivery_status;
    
    -- Drop triggers and functions
    DROP TRIGGER IF EXISTS sync_product_status_trigger ON products;
    DROP FUNCTION IF EXISTS sync_product_status();
    DROP FUNCTION IF EXISTS validate_schema_alignment();
    
    RETURN 'Schema alignment rollback completed';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- DEPLOYMENT INSTRUCTIONS
-- ==========================================
/*
PROFESSIONAL DEPLOYMENT STRATEGY:

1. BACKUP FIRST:
   pg_dump -h [host] -U [user] -d [database] > backup_before_alignment.sql

2. DEPLOY IN STAGES:
   - Run Phase 1 (Views) first - this enables immediate ML functionality
   - Test ML services with validation roadmap
   - Deploy Phase 2 (Products status) if validation passes
   - Deploy Phase 3 (Notifications) for full feature set

3. VALIDATION AFTER EACH PHASE:
   SELECT * FROM validate_schema_alignment();

4. MONITORING:
   - Check view performance vs direct table queries
   - Monitor ML service response times
   - Validate data consistency

5. FUTURE CONSIDERATIONS:
   - Consider migrating to actual pos_transactions tables for better performance
   - Plan gradual deprecation of view-based approach
   - Implement proper indexing on view columns if needed

IMMEDIATE NEXT STEPS:
1. Deploy Phase 1 (Views) to enable ML system
2. Run SystemValidationRoadmap.runCompleteValidation() to verify fix
3. Test ML services functionality
4. Deploy remaining phases based on requirements
*/
