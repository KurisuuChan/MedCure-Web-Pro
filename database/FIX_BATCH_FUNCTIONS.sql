-- ========================================
-- 🔧 FIX BATCH MANAGEMENT FUNCTIONS
-- ========================================
-- This script fixes the batch management functions to work with
-- your actual products table schema (brand_name + generic_name instead of name)
--
-- Execute this in Supabase SQL Editor
-- ========================================

-- Drop existing functions
DROP FUNCTION IF EXISTS get_all_batches_enhanced();
DROP FUNCTION IF EXISTS get_all_batches();
DROP FUNCTION IF EXISTS should_run_health_check(VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS record_health_check_run(VARCHAR, INTEGER, TEXT);

-- ========================================
-- 1. CREATE get_all_batches_enhanced()
-- ========================================
CREATE OR REPLACE FUNCTION get_all_batches_enhanced()
RETURNS TABLE (
    -- Batch Information
    id BIGINT,
    batch_id BIGINT,
    product_id UUID,
    batch_number TEXT,
    quantity INTEGER,
    original_quantity INTEGER,
    expiry_date DATE,
    days_to_expiry INTEGER,
    days_until_expiry INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ,
    
    -- Product Basic Info (for compatibility)
    product_name TEXT,
    category TEXT,
    category_name TEXT,
    supplier TEXT,
    supplier_name TEXT,
    price_per_piece NUMERIC,
    
    -- New Medicine Structure
    generic_name VARCHAR,
    brand_name VARCHAR,
    dosage_strength VARCHAR,
    dosage_form VARCHAR,
    manufacturer TEXT,
    drug_classification VARCHAR,
    pharmacologic_category VARCHAR,
    storage_conditions TEXT,
    registration_number VARCHAR,
    
    -- Additional Product Fields for UI
    product_generic_name VARCHAR,
    product_brand_name VARCHAR,
    product_dosage_strength VARCHAR,
    product_dosage_form VARCHAR,
    product_manufacturer TEXT,
    product_drug_classification VARCHAR,
    
    -- Cost and Value Information
    cost_per_unit NUMERIC,
    cost_price NUMERIC,
    total_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Batch Information
        pb.id,
        pb.id as batch_id,
        pb.product_id,
        pb.batch_number,
        pb.quantity,
        COALESCE(pb.quantity, pb.quantity) as original_quantity,
        pb.expiry_date,
        CASE 
            WHEN pb.expiry_date IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM pb.expiry_date - CURRENT_DATE)::INTEGER
        END as days_to_expiry,
        CASE 
            WHEN pb.expiry_date IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM pb.expiry_date - CURRENT_DATE)::INTEGER
        END as days_until_expiry,
        CASE 
            WHEN pb.quantity = 0 THEN 'depleted'
            WHEN pb.expiry_date IS NULL THEN 'active'
            WHEN pb.expiry_date < CURRENT_DATE THEN 'expired'
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
            ELSE 'active'
        END as status,
        pb.created_at,
        
        -- Product Basic Info (backward compatibility) - FIXED: Use brand_name instead of p.name
        COALESCE(p.brand_name, p.generic_name, 'Unknown Product') as product_name,
        COALESCE(cat.name, p.category, 'Uncategorized') as category,
        COALESCE(cat.name, p.category, 'Uncategorized') as category_name,
        COALESCE(sup.name, p.supplier, 'Unknown Supplier') as supplier,
        COALESCE(sup.name, p.supplier, 'Unknown Supplier') as supplier_name,
        p.price_per_piece,
        
        -- New Medicine Structure
        p.generic_name,
        p.brand_name,
        p.dosage_strength,
        p.dosage_form::VARCHAR,
        p.manufacturer,
        p.drug_classification::VARCHAR,
        p.pharmacologic_category,
        p.storage_conditions,
        p.registration_number,
        
        -- Prefixed versions for batch display components
        p.generic_name as product_generic_name,
        p.brand_name as product_brand_name,
        p.dosage_strength as product_dosage_strength,
        p.dosage_form::VARCHAR as product_dosage_form,
        p.manufacturer as product_manufacturer,
        p.drug_classification::VARCHAR as product_drug_classification,
        
        -- Cost and Value Information
        p.cost_price as cost_per_unit,
        p.cost_price,
        (pb.quantity * COALESCE(p.cost_price, p.price_per_piece, 0)) as total_value
        
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    LEFT JOIN suppliers sup ON p.supplier_id = sup.id
    WHERE p.is_active = true OR p.is_active IS NULL
    ORDER BY 
        CASE 
            WHEN pb.expiry_date IS NULL THEN 5
            WHEN pb.expiry_date < CURRENT_DATE THEN 1
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 2
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 3
            ELSE 4
        END,
        pb.expiry_date ASC NULLS LAST,
        pb.created_at DESC;
END;
$$;

-- ========================================
-- 2. CREATE get_all_batches() (Basic version)
-- ========================================
CREATE OR REPLACE FUNCTION get_all_batches()
RETURNS TABLE (
    id BIGINT,
    batch_id BIGINT,
    product_id UUID,
    batch_number TEXT,
    quantity INTEGER,
    expiry_date DATE,
    days_until_expiry INTEGER,
    status TEXT,
    product_name TEXT,
    category TEXT,
    price_per_piece NUMERIC,
    cost_price NUMERIC,
    total_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id,
        pb.id as batch_id,
        pb.product_id,
        pb.batch_number,
        pb.quantity,
        pb.expiry_date,
        CASE 
            WHEN pb.expiry_date IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM pb.expiry_date - CURRENT_DATE)::INTEGER
        END as days_until_expiry,
        CASE 
            WHEN pb.quantity = 0 THEN 'depleted'
            WHEN pb.expiry_date IS NULL THEN 'active'
            WHEN pb.expiry_date < CURRENT_DATE THEN 'expired'
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
            ELSE 'active'
        END as status,
        -- FIXED: Use brand_name instead of p.name
        COALESCE(p.brand_name, p.generic_name, 'Unknown') as product_name,
        COALESCE(cat.name, p.category, 'Uncategorized') as category,
        p.price_per_piece,
        p.cost_price,
        (pb.quantity * COALESCE(p.cost_price, p.price_per_piece, 0)) as total_value
        
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    WHERE p.is_active = true OR p.is_active IS NULL
    ORDER BY pb.expiry_date ASC NULLS LAST, pb.created_at DESC;
END;
$$;

-- ========================================
-- 3. CREATE HEALTH CHECK FUNCTIONS (for NotificationService)
-- ========================================

-- Function to check if health check should run
CREATE OR REPLACE FUNCTION should_run_health_check(
    p_check_type VARCHAR,
    p_interval_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_run TIMESTAMPTZ;
    should_run BOOLEAN;
BEGIN
    -- Check if enough time has passed since last run
    SELECT MAX(created_at) INTO last_run
    FROM health_check_log
    WHERE check_type = p_check_type
      AND status = 'success';
    
    -- If never run or interval passed, allow run
    IF last_run IS NULL THEN
        should_run := TRUE;
    ELSE
        should_run := (CURRENT_TIMESTAMP - last_run) >= (p_interval_minutes || ' minutes')::INTERVAL;
    END IF;
    
    RETURN should_run;
EXCEPTION
    WHEN undefined_table THEN
        -- If health_check_log table doesn't exist, allow run
        RETURN TRUE;
    WHEN OTHERS THEN
        -- On any other error, allow run (fail open)
        RETURN TRUE;
END;
$$;

-- Function to record health check run
CREATE OR REPLACE FUNCTION record_health_check_run(
    p_check_type VARCHAR,
    p_notifications_created INTEGER DEFAULT 0,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Try to insert into health_check_log if it exists
    INSERT INTO health_check_log (
        check_type,
        status,
        notifications_created,
        error_message,
        created_at
    ) VALUES (
        p_check_type,
        CASE WHEN p_error_message IS NULL THEN 'success' ELSE 'error' END,
        p_notifications_created,
        p_error_message,
        CURRENT_TIMESTAMP
    );
EXCEPTION
    WHEN undefined_table THEN
        -- If table doesn't exist, silently ignore
        RETURN;
    WHEN OTHERS THEN
        -- On any other error, silently ignore
        RETURN;
END;
$$;

-- ========================================
-- 4. GRANT PERMISSIONS
-- ========================================
GRANT EXECUTE ON FUNCTION get_all_batches_enhanced() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_batches_enhanced() TO anon;
GRANT EXECUTE ON FUNCTION get_all_batches_enhanced() TO service_role;

GRANT EXECUTE ON FUNCTION get_all_batches() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_batches() TO anon;
GRANT EXECUTE ON FUNCTION get_all_batches() TO service_role;

GRANT EXECUTE ON FUNCTION should_run_health_check(VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION should_run_health_check(VARCHAR, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION should_run_health_check(VARCHAR, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION record_health_check_run(VARCHAR, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_health_check_run(VARCHAR, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION record_health_check_run(VARCHAR, INTEGER, TEXT) TO service_role;

-- ========================================
-- 5. TEST THE FUNCTIONS
-- ========================================
-- Uncomment to test:
-- SELECT COUNT(*) as total_batches FROM get_all_batches_enhanced();
-- SELECT COUNT(*) as total_batches FROM get_all_batches();
-- SELECT should_run_health_check('all', 15);

-- ========================================
-- ✅ DONE!
-- ========================================
SELECT 
    'Batch functions fixed!' as message,
    'Functions created: get_all_batches_enhanced(), get_all_batches(), should_run_health_check(), record_health_check_run()' as details,
    'Your Batch Management page should now work!' as next_step;
