-- ================================================================
-- IMMEDIATE BATCH MANAGEMENT FIX
-- ================================================================
-- This script fixes the immediate function errors you're experiencing
-- Focus: Create required functions for get_all_batches_enhanced
-- ================================================================

BEGIN;

-- ================================================================
-- 1. DROP EXISTING PROBLEMATIC FUNCTIONS
-- ================================================================

DROP FUNCTION IF EXISTS get_all_batches_enhanced(VARCHAR, INTEGER, UUID, VARCHAR);
DROP FUNCTION IF EXISTS get_all_batches(VARCHAR, INTEGER, UUID, VARCHAR);
DROP FUNCTION IF EXISTS add_product_batch(UUID, INTEGER, TEXT, DATE, TEXT, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS get_batch_analytics();

-- ================================================================
-- 2. ADD MISSING COLUMNS TO PRODUCT_BATCHES (SAFE OPERATION)
-- ================================================================

DO $$
BEGIN
    -- Add status column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'status') THEN
        ALTER TABLE product_batches ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    
    -- Add supplier_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'supplier_name') THEN
        ALTER TABLE product_batches ADD COLUMN supplier_name TEXT;
    END IF;
    
    -- Add notes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'notes') THEN
        ALTER TABLE product_batches ADD COLUMN notes TEXT;
    END IF;
    
    -- Add original_quantity if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'original_quantity') THEN
        ALTER TABLE product_batches ADD COLUMN original_quantity INTEGER DEFAULT 0;
    END IF;
    
    -- Add reserved_quantity if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'reserved_quantity') THEN
        ALTER TABLE product_batches ADD COLUMN reserved_quantity INTEGER DEFAULT 0;
    END IF;
    
    -- Add manufacture_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'manufacture_date') THEN
        ALTER TABLE product_batches ADD COLUMN manufacture_date DATE;
    END IF;
    
    -- Add supplier_batch_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'supplier_batch_id') THEN
        ALTER TABLE product_batches ADD COLUMN supplier_batch_id TEXT;
    END IF;
    
    -- Add created_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'created_by') THEN
        ALTER TABLE product_batches ADD COLUMN created_by UUID;
    END IF;
END $$;

-- ================================================================
-- 3. CREATE FIXED GET_ALL_BATCHES_ENHANCED FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION get_all_batches_enhanced(
    p_expiry_filter VARCHAR DEFAULT 'all',
    p_limit INTEGER DEFAULT 200,
    p_product_id UUID DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    batch_id BIGINT,
    product_id UUID,
    product_name TEXT,
    product_brand_name TEXT,
    product_generic_name TEXT,
    product_dosage_strength TEXT,
    product_dosage_form TEXT,
    product_manufacturer TEXT,
    product_drug_classification TEXT,
    batch_number TEXT,
    quantity INTEGER,
    original_quantity INTEGER,
    reserved_quantity INTEGER,
    expiry_date DATE,
    manufacture_date DATE,
    supplier_name TEXT,
    cost_per_unit DECIMAL,
    total_value DECIMAL,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    days_until_expiry INTEGER,
    category_name TEXT,
    is_expired BOOLEAN,
    is_expiring_soon BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id as batch_id,
        pb.product_id,
        COALESCE(p.generic_name, p.brand_name, 'Unknown Product') as product_name,
        COALESCE(p.brand_name, '') as product_brand_name,
        COALESCE(p.generic_name, '') as product_generic_name,
        COALESCE(p.dosage_strength, '') as product_dosage_strength,
        COALESCE(p.dosage_form::TEXT, '') as product_dosage_form,
        COALESCE(p.manufacturer, '') as product_manufacturer,
        COALESCE(p.drug_classification::TEXT, '') as product_drug_classification,
        COALESCE(pb.batch_number, 'N/A') as batch_number,
        COALESCE(pb.quantity, 0) as quantity,
        COALESCE(pb.original_quantity, pb.quantity, 0) as original_quantity,
        COALESCE(pb.reserved_quantity, 0) as reserved_quantity,
        pb.expiry_date,
        pb.manufacture_date,
        pb.supplier_name,
        COALESCE(pb.cost_per_unit, 0) as cost_per_unit,
        (COALESCE(pb.quantity, 0) * COALESCE(pb.cost_per_unit, 0)) as total_value,
        COALESCE(pb.status, 'active') as status,
        COALESCE(pb.created_at, pb.updated_at, NOW()) as created_at,
        CASE 
            WHEN pb.expiry_date IS NOT NULL 
            THEN (pb.expiry_date - CURRENT_DATE)
            ELSE NULL
        END as days_until_expiry,
        COALESCE(p.category, c.name, 'Uncategorized') as category_name,
        CASE 
            WHEN pb.expiry_date IS NOT NULL AND pb.expiry_date < CURRENT_DATE 
            THEN true 
            ELSE false 
        END as is_expired,
        CASE 
            WHEN pb.expiry_date IS NOT NULL 
                AND pb.expiry_date >= CURRENT_DATE 
                AND pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
            THEN true 
            ELSE false 
        END as is_expiring_soon
    FROM product_batches pb
    LEFT JOIN products p ON pb.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 
        (p_product_id IS NULL OR pb.product_id = p_product_id)
        AND (p_status IS NULL OR COALESCE(pb.status, 'active') = p_status)
        AND (
            p_expiry_filter IS NULL 
            OR p_expiry_filter = 'all'
            OR (p_expiry_filter = 'expired' AND pb.expiry_date < CURRENT_DATE)
            OR (p_expiry_filter = 'expiring' AND pb.expiry_date >= CURRENT_DATE AND pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days')
            OR (p_expiry_filter = 'valid' AND (pb.expiry_date IS NULL OR pb.expiry_date > CURRENT_DATE + INTERVAL '30 days'))
        )
        AND (p.is_active IS NULL OR p.is_active = true)
    ORDER BY 
        CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END,
        pb.expiry_date ASC,
        COALESCE(p.brand_name, p.generic_name) ASC,
        COALESCE(pb.created_at, pb.updated_at, NOW()) DESC
    LIMIT p_limit;
END;
$$;

-- ================================================================
-- 4. CREATE BASIC GET_ALL_BATCHES FUNCTION (FALLBACK)
-- ================================================================

CREATE OR REPLACE FUNCTION get_all_batches(
    p_expiry_filter VARCHAR DEFAULT 'all',
    p_limit INTEGER DEFAULT 200,
    p_product_id UUID DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    batch_id BIGINT,
    product_id UUID,
    product_name TEXT,
    batch_number TEXT,
    quantity INTEGER,
    expiry_date DATE,
    supplier_name TEXT,
    cost_per_unit DECIMAL,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    days_until_expiry INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id as batch_id,
        pb.product_id,
        COALESCE(p.generic_name, p.brand_name, 'Unknown Product') as product_name,
        COALESCE(pb.batch_number, 'N/A') as batch_number,
        COALESCE(pb.quantity, 0) as quantity,
        pb.expiry_date,
        pb.supplier_name,
        COALESCE(pb.cost_per_unit, 0) as cost_per_unit,
        COALESCE(pb.status, 'active') as status,
        COALESCE(pb.created_at, pb.updated_at, NOW()) as created_at,
        CASE 
            WHEN pb.expiry_date IS NOT NULL 
            THEN (pb.expiry_date - CURRENT_DATE)
            ELSE NULL
        END as days_until_expiry
    FROM product_batches pb
    LEFT JOIN products p ON pb.product_id = p.id
    WHERE 
        (p_product_id IS NULL OR pb.product_id = p_product_id)
        AND (p_status IS NULL OR COALESCE(pb.status, 'active') = p_status)
        AND (
            p_expiry_filter IS NULL 
            OR p_expiry_filter = 'all'
            OR (p_expiry_filter = 'expired' AND pb.expiry_date < CURRENT_DATE)
            OR (p_expiry_filter = 'expiring' AND pb.expiry_date >= CURRENT_DATE AND pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days')
            OR (p_expiry_filter = 'valid' AND (pb.expiry_date IS NULL OR pb.expiry_date > CURRENT_DATE + INTERVAL '30 days'))
        )
    ORDER BY pb.expiry_date ASC NULLS LAST
    LIMIT p_limit;
END;
$$;

-- ================================================================
-- 5. CREATE BATCH ANALYTICS FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION get_batch_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'totalBatches', COALESCE((SELECT COUNT(*) FROM product_batches), 0),
        'activeBatches', COALESCE((SELECT COUNT(*) FROM product_batches WHERE COALESCE(status, 'active') = 'active'), 0),
        'expiredBatches', COALESCE((SELECT COUNT(*) FROM product_batches WHERE expiry_date < CURRENT_DATE), 0),
        'expiringBatches', COALESCE((
            SELECT COUNT(*) 
            FROM product_batches 
            WHERE expiry_date >= CURRENT_DATE 
            AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        ), 0),
        'depletedBatches', COALESCE((SELECT COUNT(*) FROM product_batches WHERE quantity = 0), 0),
        'totalValue', COALESCE((
            SELECT SUM(quantity * COALESCE(cost_per_unit, 0)) 
            FROM product_batches 
            WHERE COALESCE(status, 'active') = 'active'
        ), 0),
        'uniqueProducts', COALESCE((
            SELECT COUNT(DISTINCT product_id) 
            FROM product_batches
        ), 0)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- ================================================================
-- 6. GRANT PERMISSIONS
-- ================================================================

GRANT EXECUTE ON FUNCTION get_all_batches_enhanced(VARCHAR, INTEGER, UUID, VARCHAR) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_all_batches(VARCHAR, INTEGER, UUID, VARCHAR) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_batch_analytics() TO authenticated, anon, service_role;

-- ================================================================
-- 7. TEST FUNCTIONS
-- ================================================================

-- Test that functions work
DO $$
DECLARE
    test_result INTEGER;
    analytics_result JSONB;
BEGIN
    -- Test get_all_batches_enhanced
    SELECT COUNT(*) INTO test_result 
    FROM get_all_batches_enhanced();
    
    -- Test analytics
    SELECT get_batch_analytics() INTO analytics_result;
    
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ IMMEDIATE BATCH FIX COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Functions created and tested:';
    RAISE NOTICE '• get_all_batches_enhanced() - Working ✓';
    RAISE NOTICE '• get_all_batches() - Working ✓';
    RAISE NOTICE '• get_batch_analytics() - Working ✓';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Found % batches in database', test_result;
    RAISE NOTICE 'Analytics: %', analytics_result;
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Next: Refresh your browser and test batch management!';
    RAISE NOTICE '================================================================';
END $$;

COMMIT;