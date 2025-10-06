-- ================================================================
-- FRESH BATCH FUNCTIONS - FROM SCRATCH
-- ================================================================
-- Run this AFTER the cleanup script
-- Creates simple, clean batch management functions
-- ================================================================

BEGIN;

-- ================================================================
-- 1. ADD ESSENTIAL COLUMNS (SAFE)
-- ================================================================

DO $$
BEGIN
    -- Add status column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'status') THEN
        ALTER TABLE product_batches ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Added status column to product_batches';
    END IF;
    
    -- Add supplier_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'supplier_name') THEN
        ALTER TABLE product_batches ADD COLUMN supplier_name TEXT;
        RAISE NOTICE 'Added supplier_name column to product_batches';
    END IF;
END $$;

-- ================================================================
-- 2. CREATE MAIN BATCH FUNCTION (SIMPLE VERSION)
-- ================================================================

CREATE FUNCTION get_all_batches_enhanced(
    p_expiry_filter TEXT DEFAULT 'all',
    p_limit INTEGER DEFAULT 200,
    p_product_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    batch_id BIGINT,
    product_id UUID,
    product_name VARCHAR,
    product_brand_name VARCHAR,
    product_generic_name VARCHAR,
    product_dosage_strength VARCHAR,
    product_dosage_form VARCHAR,
    product_manufacturer VARCHAR,
    product_drug_classification VARCHAR,
    batch_number VARCHAR,
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
    category_name VARCHAR,
    is_expired BOOLEAN,
    is_expiring_soon BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id as batch_id,
        pb.product_id,
        COALESCE(p.generic_name, p.brand_name, 'Unknown Product')::VARCHAR as product_name,
        COALESCE(p.brand_name, '')::VARCHAR as product_brand_name,
        COALESCE(p.generic_name, '')::VARCHAR as product_generic_name,
        COALESCE(p.dosage_strength, '')::VARCHAR as product_dosage_strength,
        COALESCE(p.dosage_form::TEXT, '')::VARCHAR as product_dosage_form,
        COALESCE(p.manufacturer, '')::VARCHAR as product_manufacturer,
        COALESCE(p.drug_classification::TEXT, '')::VARCHAR as product_drug_classification,
        COALESCE(pb.batch_number, 'N/A')::VARCHAR as batch_number,
        COALESCE(pb.quantity, 0) as quantity,
        COALESCE(pb.quantity, 0) as original_quantity,
        0 as reserved_quantity,
        pb.expiry_date,
        pb.expiry_date as manufacture_date,
        pb.supplier_name,
        COALESCE(pb.cost_per_unit, 0) as cost_per_unit,
        (COALESCE(pb.quantity, 0) * COALESCE(pb.cost_per_unit, 0)) as total_value,
        COALESCE(pb.status, 'active')::VARCHAR as status,
        COALESCE(pb.created_at, pb.updated_at, NOW()) as created_at,
        CASE 
            WHEN pb.expiry_date IS NOT NULL 
            THEN (pb.expiry_date - CURRENT_DATE)
            ELSE NULL
        END as days_until_expiry,
        COALESCE(p.category, 'Uncategorized')::VARCHAR as category_name,
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
    WHERE 
        (p_product_id IS NULL OR pb.product_id = p_product_id)
        AND (p_status IS NULL OR COALESCE(pb.status, 'active') = p_status)
        AND (
            p_expiry_filter = 'all'
            OR (p_expiry_filter = 'expired' AND pb.expiry_date < CURRENT_DATE)
            OR (p_expiry_filter = 'expiring' AND pb.expiry_date >= CURRENT_DATE AND pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days')
            OR (p_expiry_filter = 'valid' AND (pb.expiry_date IS NULL OR pb.expiry_date > CURRENT_DATE + INTERVAL '30 days'))
        )
    ORDER BY 
        pb.expiry_date ASC NULLS LAST,
        COALESCE(p.brand_name, p.generic_name) ASC
    LIMIT p_limit;
END;
$$;

-- ================================================================
-- 3. CREATE SIMPLE FALLBACK FUNCTION
-- ================================================================

CREATE FUNCTION get_all_batches(
    p_expiry_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
    batch_id BIGINT,
    product_id UUID,
    product_name VARCHAR,
    batch_number VARCHAR,
    quantity INTEGER,
    expiry_date DATE,
    status VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id as batch_id,
        pb.product_id,
        COALESCE(p.generic_name, p.brand_name, 'Unknown Product')::VARCHAR as product_name,
        COALESCE(pb.batch_number, 'N/A')::VARCHAR as batch_number,
        COALESCE(pb.quantity, 0) as quantity,
        pb.expiry_date,
        COALESCE(pb.status, 'active')::VARCHAR as status
    FROM product_batches pb
    LEFT JOIN products p ON pb.product_id = p.id
    ORDER BY pb.expiry_date ASC NULLS LAST;
END;
$$;

-- ================================================================
-- 4. CREATE ANALYTICS FUNCTION
-- ================================================================

CREATE FUNCTION get_batch_analytics()
RETURNS JSONB
LANGUAGE plpgsql
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
        ), 0)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- ================================================================
-- 5. GRANT PERMISSIONS
-- ================================================================

GRANT EXECUTE ON FUNCTION get_all_batches_enhanced(TEXT, INTEGER, UUID, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_all_batches(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_batch_analytics() TO authenticated, anon, service_role;

-- ================================================================
-- 6. TEST FUNCTIONS
-- ================================================================

DO $$
DECLARE
    test_count INTEGER;
    analytics_result JSONB;
BEGIN
    -- Test main function
    SELECT COUNT(*) INTO test_count FROM get_all_batches_enhanced();
    
    -- Test analytics
    SELECT get_batch_analytics() INTO analytics_result;
    
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ FRESH BATCH FUNCTIONS CREATED SUCCESSFULLY!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '• get_all_batches_enhanced() - Main function ✓';
    RAISE NOTICE '• get_all_batches() - Fallback function ✓';
    RAISE NOTICE '• get_batch_analytics() - Analytics function ✓';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Database status:';
    RAISE NOTICE '• Total batches found: %', test_count;
    RAISE NOTICE '• Analytics result: %', analytics_result;
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Next: Refresh your browser and test batch management!';
    RAISE NOTICE '================================================================';
END $$;

COMMIT;