-- ================================================================
-- COMPLETE BATCH SYSTEM FIX
-- ================================================================
-- This fixes all the batch management issues:
-- 1. Incremental batch numbering (resets daily)
-- 2. Stock updating when adding batches
-- 3. Proper error handling
-- Run this in Supabase SQL Editor
-- ================================================================

BEGIN;

-- ================================================================
-- CREATE IMPROVED ADD_PRODUCT_BATCH FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION add_product_batch(
    p_product_id UUID,
    p_quantity INTEGER,
    p_expiry_date DATE,
    p_cost_per_unit DECIMAL DEFAULT 0,
    p_supplier_name TEXT DEFAULT NULL,
    p_batch_number VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    batch_id BIGINT,
    message TEXT,
    success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_batch_id BIGINT;
    auto_batch_number VARCHAR;
    product_name VARCHAR;
    daily_sequence INTEGER;
BEGIN
    -- Get product name for logging
    SELECT COALESCE(brand_name, generic_name, 'Unknown') 
    INTO product_name
    FROM products 
    WHERE id = p_product_id;
    
    IF product_name IS NULL THEN
        RETURN QUERY SELECT 
            NULL::BIGINT as batch_id,
            'Product not found' as message,
            false as success;
        RETURN;
    END IF;
    
    -- Generate auto batch number if not provided (incremental, daily reset)
    IF p_batch_number IS NULL THEN
        -- Get the next incremental number for today
        SELECT COUNT(*) + 1 
        INTO daily_sequence
        FROM product_batches 
        WHERE DATE(created_at) = CURRENT_DATE;
        
        auto_batch_number := 'BT' || TO_CHAR(NOW(), 'MMDDYY') || '-' || LPAD(daily_sequence::TEXT, 3, '0');
    ELSE
        auto_batch_number := p_batch_number;
    END IF;
    
    -- Insert the new batch
    INSERT INTO product_batches (
        product_id,
        quantity,
        expiry_date,
        cost_per_unit,
        supplier_name,
        batch_number,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_product_id,
        p_quantity,
        p_expiry_date,
        COALESCE(p_cost_per_unit, 0),
        p_supplier_name,
        auto_batch_number,
        'active',
        NOW(),
        NOW()
    ) RETURNING id INTO new_batch_id;
    
    -- Update product stock
    UPDATE products 
    SET 
        stock_in_pieces = COALESCE(stock_in_pieces, 0) + p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    -- Return success result
    RETURN QUERY SELECT 
        new_batch_id as batch_id,
        'Batch ' || auto_batch_number || ' created successfully. Stock updated: +' || p_quantity || ' pieces.' as message,
        true as success;
        
    RAISE NOTICE 'Created batch % for product % with quantity %. Stock updated.', auto_batch_number, product_name, p_quantity;
    
EXCEPTION WHEN OTHERS THEN
    -- Return error result
    RETURN QUERY SELECT 
        NULL::BIGINT as batch_id,
        'Error creating batch: ' || SQLERRM as message,
        false as success;
END $$;

-- ================================================================
-- GRANT PERMISSIONS
-- ================================================================

GRANT EXECUTE ON FUNCTION add_product_batch TO authenticated;
GRANT EXECUTE ON FUNCTION add_product_batch TO anon;

-- ================================================================
-- TEST THE FUNCTION (Optional)
-- ================================================================

-- Test incremental numbering with a real product
DO $$
DECLARE
    test_product_id UUID;
    result_record RECORD;
BEGIN
    -- Get the first product for testing
    SELECT id INTO test_product_id FROM products LIMIT 1;
    
    IF test_product_id IS NOT NULL THEN
        -- Test the function
        FOR result_record IN 
            SELECT * FROM add_product_batch(
                test_product_id,
                10,
                (CURRENT_DATE + INTERVAL '6 months')::DATE,
                5.50,
                'Test Supplier',
                NULL
            )
        LOOP
            RAISE NOTICE 'Test Result: success=%, message=%', result_record.success, result_record.message;
        END LOOP;
    ELSE
        RAISE NOTICE 'No products found for testing';
    END IF;
END $$;

COMMIT;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check if function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'add_product_batch';

-- Show today's batch sequence
SELECT 
    batch_number,
    created_at,
    product_id
FROM product_batches 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at;

RAISE NOTICE '✅ Batch system updated successfully! Features:';
RAISE NOTICE '  - Incremental batch numbering (resets daily)';
RAISE NOTICE '  - Automatic stock updates';
RAISE NOTICE '  - Proper error handling';
RAISE NOTICE '  - Format: BTMMDDYY-001, BTMMDDYY-002, etc.';