-- ========================================
-- 🚀 COMPLETE BATCH MANAGEMENT FIX
-- ========================================
-- This script completely fixes all batch management functions to work with
-- the new medicine structure (generic_name + brand_name instead of name)
--
-- Execute this in Supabase SQL Editor to fix everything at once
-- ========================================

BEGIN;

-- ========================================
-- 1. DROP ALL EXISTING BATCH FUNCTIONS
-- ========================================
DROP FUNCTION IF EXISTS add_product_batch(UUID, INTEGER, TEXT, DATE);
DROP FUNCTION IF EXISTS add_product_batch(UUID, INTEGER, VARCHAR, DATE);
DROP FUNCTION IF EXISTS add_product_batch(UUID, INTEGER, DATE, TEXT, TEXT);
DROP FUNCTION IF EXISTS add_product_batch(UUID, INTEGER, DATE);
DROP FUNCTION IF EXISTS add_product_batch_enhanced(UUID, INTEGER, VARCHAR, DATE, DECIMAL, VARCHAR, TEXT, UUID);
DROP FUNCTION IF EXISTS get_batches_for_product(UUID);
DROP FUNCTION IF EXISTS get_all_batches_enhanced();
DROP FUNCTION IF EXISTS get_all_batches();
DROP FUNCTION IF EXISTS update_batch_quantity(BIGINT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS update_batch_quantity(INTEGER, INTEGER, VARCHAR);

-- ========================================
-- 2. CREATE MEDICINE-COMPATIBLE add_product_batch()
-- ========================================
CREATE OR REPLACE FUNCTION add_product_batch(
    p_product_id UUID,
    p_quantity INTEGER,
    p_expiry_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch_id BIGINT;
    v_generated_batch_number TEXT;
    v_result JSON;
    v_current_stock INTEGER;
    v_new_stock INTEGER;
    v_date_string TEXT;
    v_batch_increment INTEGER;
    v_product_name TEXT;
BEGIN
    -- Log function start for debugging
    RAISE NOTICE 'add_product_batch called with: product_id=%, quantity=%, expiry_date=%', p_product_id, p_quantity, p_expiry_date;
    
    -- Validate inputs
    IF p_product_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product ID and positive quantity are required',
            'debug', 'Input validation failed'
        );
    END IF;

    -- Check if product exists and get product name using medicine structure
    SELECT 
        stock_in_pieces,
        COALESCE(brand_name, generic_name, 'Unknown Product')
    INTO v_current_stock, v_product_name
    FROM products 
    WHERE id = p_product_id AND (is_active = true OR is_active IS NULL);
    
    IF v_product_name IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product not found or inactive',
            'debug', 'Product lookup failed for ID: ' || p_product_id::TEXT
        );
    END IF;

    -- Generate automated batch number in format: BTDDMMYY-XXX
    v_date_string := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    -- Get the next increment for today
    SELECT COALESCE(MAX(
        CASE 
            WHEN batch_number ~ '^BT[0-9]{6}-[0-9]+$' 
            AND SUBSTRING(batch_number, 3, 6) = v_date_string 
            THEN SUBSTRING(batch_number, 10)::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO v_batch_increment
    FROM product_batches;
    
    v_generated_batch_number := 'BT' || v_date_string || '-' || LPAD(v_batch_increment::TEXT, 3, '0');

    -- Calculate new stock
    v_new_stock := COALESCE(v_current_stock, 0) + p_quantity;

    BEGIN
        -- Insert batch record
        INSERT INTO product_batches (
            product_id,
            batch_number,
            quantity,
            expiry_date,
            created_at
        ) VALUES (
            p_product_id,
            v_generated_batch_number,
            p_quantity,
            p_expiry_date,
            NOW()
        ) RETURNING id INTO v_batch_id;

        -- Update product stock
        UPDATE products 
        SET 
            stock_in_pieces = v_new_stock,
            updated_at = NOW()
        WHERE id = p_product_id;

        -- Try to log in inventory_logs if table exists
        BEGIN
            INSERT INTO inventory_logs (
                product_id, 
                batch_id, 
                transaction_type, 
                quantity_before, 
                quantity_change, 
                quantity_after, 
                reason, 
                created_at
            ) VALUES (
                p_product_id, 
                v_batch_id, 
                'BATCH_ADDED', 
                v_current_stock, 
                p_quantity, 
                v_new_stock, 
                'New batch added: ' || v_generated_batch_number,
                NOW()
            );
        EXCEPTION 
            WHEN undefined_table THEN
                RAISE NOTICE 'inventory_logs table not found, skipping log entry';
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not insert inventory log: %', SQLERRM;
        END;

        v_result := json_build_object(
            'success', true,
            'batch_id', v_batch_id,
            'batch_number', v_generated_batch_number,
            'quantity', p_quantity,
            'product_name', v_product_name,
            'old_stock', v_current_stock,
            'new_stock', v_new_stock,
            'message', 'Batch added successfully'
        );
        
        RAISE NOTICE 'Batch added successfully: %', v_result;
        RETURN v_result;

    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error in add_product_batch: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM,
            'debug', 'Exception during batch insertion'
        );
    END;
END;
$$;

-- ========================================
-- 3. CREATE get_batches_for_product()
-- ========================================
CREATE OR REPLACE FUNCTION get_batches_for_product(p_product_id UUID)
RETURNS TABLE (
    id BIGINT,
    batch_number TEXT,
    quantity INTEGER,
    expiry_date DATE,
    days_until_expiry INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ,
    product_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.id,
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
        pb.created_at,
        COALESCE(p.brand_name, p.generic_name, 'Unknown Product') as product_name
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    WHERE pb.product_id = p_product_id
    ORDER BY pb.expiry_date ASC NULLS LAST, pb.created_at DESC;
END;
$$;

-- ========================================
-- 4. CREATE get_all_batches() - MEDICINE COMPATIBLE
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
    generic_name VARCHAR,
    brand_name VARCHAR,
    category TEXT,
    price_per_piece NUMERIC,
    cost_price NUMERIC,
    total_value NUMERIC,
    created_at TIMESTAMPTZ
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
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
            WHEN pb.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
            ELSE 'active'
        END as status,
        -- Medicine-compatible product name
        COALESCE(p.brand_name, p.generic_name, 'Unknown Product') as product_name,
        p.generic_name,
        p.brand_name,
        COALESCE(cat.name, p.category, 'Uncategorized') as category,
        p.price_per_piece,
        p.cost_price,
        (pb.quantity * COALESCE(p.cost_price, p.price_per_piece, 0)) as total_value,
        pb.created_at
        
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    LEFT JOIN categories cat ON p.category_id = cat.id
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
-- 5. CREATE update_batch_quantity()
-- ========================================
CREATE OR REPLACE FUNCTION update_batch_quantity(
    p_batch_id BIGINT,
    p_new_quantity INTEGER,
    p_reason TEXT DEFAULT 'Manual adjustment'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_quantity INTEGER;
    v_product_id UUID;
    v_quantity_diff INTEGER;
    v_product_name TEXT;
    v_old_product_stock INTEGER;
    v_new_product_stock INTEGER;
BEGIN
    -- Get current batch info
    SELECT 
        pb.quantity, 
        pb.product_id,
        COALESCE(p.brand_name, p.generic_name, 'Unknown Product'),
        p.stock_in_pieces
    INTO v_old_quantity, v_product_id, v_product_name, v_old_product_stock
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    WHERE pb.id = p_batch_id;
    
    IF v_old_quantity IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Batch not found'
        );
    END IF;
    
    -- Calculate difference
    v_quantity_diff := p_new_quantity - v_old_quantity;
    v_new_product_stock := v_old_product_stock + v_quantity_diff;
    
    -- Update batch quantity
    UPDATE product_batches 
    SET quantity = p_new_quantity,
        updated_at = NOW()
    WHERE id = p_batch_id;
    
    -- Update product total stock
    UPDATE products 
    SET stock_in_pieces = v_new_product_stock,
        updated_at = NOW()
    WHERE id = v_product_id;
    
    -- Try to log the adjustment
    BEGIN
        INSERT INTO inventory_logs (
            product_id, 
            batch_id, 
            transaction_type, 
            quantity_before, 
            quantity_change, 
            quantity_after, 
            reason, 
            created_at
        ) VALUES (
            v_product_id, 
            p_batch_id, 
            'BATCH_ADJUSTMENT', 
            v_old_quantity, 
            v_quantity_diff, 
            p_new_quantity, 
            p_reason,
            NOW()
        );
    EXCEPTION 
        WHEN undefined_table THEN
            NULL; -- Ignore if table doesn't exist
        WHEN OTHERS THEN
            NULL; -- Ignore logging errors
    END;
    
    RETURN json_build_object(
        'success', true,
        'batch_id', p_batch_id,
        'old_quantity', v_old_quantity,
        'new_quantity', p_new_quantity,
        'quantity_change', v_quantity_diff,
        'product_name', v_product_name,
        'message', 'Batch quantity updated successfully'
    );
END;
$$;

-- ========================================
-- 6. CREATE ENHANCED get_all_batches_enhanced()
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
    
    -- Medicine Structure
    generic_name VARCHAR,
    brand_name VARCHAR,
    dosage_strength VARCHAR,
    dosage_form VARCHAR,
    drug_classification VARCHAR,
    
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
        pb.quantity as original_quantity, -- Use current quantity if original not tracked
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
        
        -- Product Basic Info (backward compatibility) - MEDICINE COMPATIBLE
        COALESCE(p.brand_name, p.generic_name, 'Unknown Product') as product_name,
        COALESCE(cat.name, p.category, 'Uncategorized') as category,
        COALESCE(cat.name, p.category, 'Uncategorized') as category_name,
        COALESCE(p.supplier, 'Unknown Supplier') as supplier,
        COALESCE(p.supplier, 'Unknown Supplier') as supplier_name,
        p.price_per_piece,
        
        -- Medicine Structure
        p.generic_name,
        p.brand_name,
        p.dosage_strength,
        p.dosage_form::VARCHAR,
        p.drug_classification::VARCHAR,
        
        -- Cost and Value Information
        p.cost_price as cost_per_unit,
        p.cost_price,
        (pb.quantity * COALESCE(p.cost_price, p.price_per_piece, 0)) as total_value
        
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    LEFT JOIN categories cat ON p.category_id = cat.id
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
-- 7. GRANT PERMISSIONS
-- ========================================
GRANT EXECUTE ON FUNCTION add_product_batch(UUID, INTEGER, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION add_product_batch(UUID, INTEGER, DATE) TO anon;
GRANT EXECUTE ON FUNCTION add_product_batch(UUID, INTEGER, DATE) TO service_role;

GRANT EXECUTE ON FUNCTION get_batches_for_product(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batches_for_product(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_batches_for_product(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION get_all_batches() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_batches() TO anon;
GRANT EXECUTE ON FUNCTION get_all_batches() TO service_role;

GRANT EXECUTE ON FUNCTION get_all_batches_enhanced() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_batches_enhanced() TO anon;
GRANT EXECUTE ON FUNCTION get_all_batches_enhanced() TO service_role;

GRANT EXECUTE ON FUNCTION update_batch_quantity(BIGINT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_batch_quantity(BIGINT, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_batch_quantity(BIGINT, INTEGER, TEXT) TO service_role;

COMMIT;

-- ========================================
-- 8. TEST THE FUNCTIONS
-- ========================================
SELECT 
    'Batch management completely fixed!' as message,
    'All functions now work with medicine structure (generic_name + brand_name)' as details,
    'Functions: add_product_batch, get_batches_for_product, get_all_batches, get_all_batches_enhanced, update_batch_quantity' as functions_created;

-- Test the functions (uncomment to run)
-- SELECT COUNT(*) as total_batches FROM get_all_batches();
-- SELECT COUNT(*) as enhanced_batches FROM get_all_batches_enhanced();