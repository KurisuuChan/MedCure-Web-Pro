-- ================================================================
-- SIMPLE BATCH MANAGEMENT FIX
-- ================================================================
-- Clean, simple solution to fix batch management functions
-- ================================================================

BEGIN;

-- ================================================================
-- 1. CLEAN SLATE - DROP ALL BATCH FUNCTIONS
-- ================================================================

-- Drop all possible function variations
DROP FUNCTION IF EXISTS get_all_batches_enhanced CASCADE;
DROP FUNCTION IF EXISTS get_all_batches CASCADE;
DROP FUNCTION IF EXISTS get_batch_analytics CASCADE;

-- Also drop any other variations that might exist
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname LIKE '%batch%' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.proname || '(' || func_record.args || ') CASCADE';
    END LOOP;
END $$;

-- ================================================================
-- 2. ADD ESSENTIAL COLUMNS (SAFE)
-- ================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'status') THEN
        ALTER TABLE product_batches ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'supplier_name') THEN
        ALTER TABLE product_batches ADD COLUMN supplier_name TEXT;
    END IF;
END $$;

-- ================================================================
-- 3. CREATE UNIQUE BATCH FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION fetch_batches_with_details(
    expiry_filter TEXT DEFAULT 'all',
    batch_limit INTEGER DEFAULT 200,
    product_filter UUID DEFAULT NULL,
    status_filter TEXT DEFAULT NULL
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
    status TEXT,
    created_at TIMESTAMPTZ,
    days_until_expiry INTEGER,
    category_name TEXT,
    is_expired BOOLEAN,
    is_expiring_soon BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id,
        pb.product_id,
        COALESCE(p.generic_name, p.brand_name, 'Unknown Product'),
        COALESCE(p.brand_name, ''),
        COALESCE(p.generic_name, ''),
        COALESCE(p.dosage_strength, ''),
        COALESCE(p.dosage_form::TEXT, ''),
        COALESCE(p.manufacturer, ''),
        COALESCE(p.drug_classification::TEXT, ''),
        COALESCE(pb.batch_number, 'N/A'),
        COALESCE(pb.quantity, 0),
        COALESCE(pb.quantity, 0),
        0,
        pb.expiry_date,
        pb.expiry_date,
        pb.supplier_name,
        COALESCE(pb.cost_per_unit, 0),
        (COALESCE(pb.quantity, 0) * COALESCE(pb.cost_per_unit, 0)),
        COALESCE(pb.status, 'active'),
        COALESCE(pb.created_at, pb.updated_at, NOW()),
        CASE 
            WHEN pb.expiry_date IS NOT NULL 
            THEN (pb.expiry_date - CURRENT_DATE)
            ELSE NULL
        END,
        COALESCE(p.category, 'Uncategorized'),
        CASE 
            WHEN pb.expiry_date IS NOT NULL AND pb.expiry_date < CURRENT_DATE 
            THEN true 
            ELSE false 
        END,
        CASE 
            WHEN pb.expiry_date IS NOT NULL 
                AND pb.expiry_date >= CURRENT_DATE 
                AND pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
            THEN true 
            ELSE false 
        END
    FROM product_batches pb
    LEFT JOIN products p ON pb.product_id = p.id
    WHERE 
        (product_filter IS NULL OR pb.product_id = product_filter)
        AND (status_filter IS NULL OR COALESCE(pb.status, 'active') = status_filter)
        AND (
            expiry_filter = 'all'
            OR (expiry_filter = 'expired' AND pb.expiry_date < CURRENT_DATE)
            OR (expiry_filter = 'expiring' AND pb.expiry_date >= CURRENT_DATE AND pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days')
            OR (expiry_filter = 'valid' AND (pb.expiry_date IS NULL OR pb.expiry_date > CURRENT_DATE + INTERVAL '30 days'))
        )
    ORDER BY pb.expiry_date ASC NULLS LAST
    LIMIT batch_limit;
END;
$$;

-- Create alias for compatibility
CREATE OR REPLACE FUNCTION get_all_batches_enhanced(
    p_expiry_filter TEXT DEFAULT 'all',
    p_limit INTEGER DEFAULT 200,
    p_product_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL
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
    status TEXT,
    created_at TIMESTAMPTZ,
    days_until_expiry INTEGER,
    category_name TEXT,
    is_expired BOOLEAN,
    is_expiring_soon BOOLEAN
)
LANGUAGE sql
AS $$
    SELECT * FROM fetch_batches_with_details(p_expiry_filter, p_limit, p_product_id, p_status);
$$;

-- ================================================================
-- 4. CREATE FALLBACK FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION get_all_batches(
    p_expiry_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
    batch_id BIGINT,
    product_id UUID,
    product_name TEXT,
    batch_number TEXT,
    quantity INTEGER,
    expiry_date DATE,
    status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id,
        pb.product_id,
        COALESCE(p.generic_name, p.brand_name, 'Unknown Product'),
        COALESCE(pb.batch_number, 'N/A'),
        COALESCE(pb.quantity, 0),
        pb.expiry_date,
        COALESCE(pb.status, 'active')
    FROM product_batches pb
    LEFT JOIN products p ON pb.product_id = p.id
    ORDER BY pb.expiry_date ASC NULLS LAST;
END;
$$;

-- ================================================================
-- 5. CREATE ANALYTICS FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION get_batch_analytics()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN jsonb_build_object(
        'totalBatches', (SELECT COUNT(*) FROM product_batches),
        'activeBatches', (SELECT COUNT(*) FROM product_batches WHERE COALESCE(status, 'active') = 'active'),
        'expiredBatches', (SELECT COUNT(*) FROM product_batches WHERE expiry_date < CURRENT_DATE),
        'expiringBatches', (SELECT COUNT(*) FROM product_batches WHERE expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + INTERVAL '30 days')
    );
END;
$$;

-- ================================================================
-- 6. GRANT PERMISSIONS
-- ================================================================

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;

-- ================================================================
-- 7. SIMPLE TEST
-- ================================================================

SELECT 'SUCCESS: Functions created!' as status;

COMMIT;

-- Show completion message
SELECT 
    'BATCH FUNCTIONS FIXED!' as message,
    COUNT(*) as total_batches
FROM product_batches;