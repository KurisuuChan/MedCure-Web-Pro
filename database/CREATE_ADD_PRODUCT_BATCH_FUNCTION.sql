-- ================================================================
-- CREATE MISSING ADD_PRODUCT_BATCH FUNCTION
-- ================================================================
-- This creates the essential function to add new batches
-- Run this in Supabase SQL Editor immediately
-- ================================================================

BEGIN;

-- ================================================================
-- CREATE THE ADD_PRODUCT_BATCH FUNCTION
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
BEGIN
    -- Get product name for batch number generation
    SELECT COALESCE(brand_name, generic_name, 'Unknown') 
    INTO product_name
    FROM products 
    WHERE id = p_product_id;
    
    -- Generate auto batch number if not provided
    IF p_batch_number IS NULL THEN
        -- Get the next incremental number for today
        WITH daily_count AS (
            SELECT COUNT(*) + 1 as next_number
            FROM product_batches 
            WHERE DATE(created_at) = CURRENT_DATE
        )
        SELECT 'BT' || TO_CHAR(NOW(), 'MMDDYY') || '-' || LPAD(next_number::TEXT, 3, '0')
        INTO auto_batch_number
        FROM daily_count;
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
        'Batch created successfully with number: ' || auto_batch_number as message,
        true as success;
        
    RAISE NOTICE 'Created batch % for product % with quantity %', auto_batch_number, product_name, p_quantity;
    
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_product_batch TO authenticated;
GRANT EXECUTE ON FUNCTION add_product_batch TO anon;

-- ================================================================
-- TEST THE FUNCTION
-- ================================================================

-- Test with a sample product (replace with actual product ID)
/*
SELECT * FROM add_product_batch(
    'your-product-id-here'::UUID,
    50,
    '2025-12-31'::DATE,
    5.50,
    'Test Supplier',
    NULL
);
*/

COMMIT;

-- ================================================================
-- VERIFICATION
-- ================================================================

-- Check if function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_name = 'add_product_batch';

RAISE NOTICE '✅ add_product_batch function created successfully!';