-- ============================================
-- FIXED AUTOMATED BATCH NUMBERING SYSTEM
-- ============================================
-- Execute this in your Supabase SQL Editor
-- This version matches the existing table structure exactly

-- First, let's check what columns exist in your product_batches table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_batches' 
ORDER BY ordinal_position;

-- Drop the existing function
DROP FUNCTION IF EXISTS add_product_batch(UUID, INTEGER, TEXT, DATE);
DROP FUNCTION IF EXISTS add_product_batch(UUID, INTEGER, DATE, TEXT, TEXT);

-- Create the simplified automated batch numbering function
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

    -- Check if product exists
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product not found',
            'debug', 'Product lookup failed for ID: ' || p_product_id::TEXT
        );
    END IF;

    -- Get current stock
    SELECT COALESCE(stock_in_pieces, 0) INTO v_current_stock 
    FROM products WHERE id = p_product_id;
    
    v_new_stock := v_current_stock + p_quantity;

    -- Step 1: Insert new batch with NULL batch_number initially
    INSERT INTO product_batches (
        product_id,
        batch_number,
        quantity,
        original_quantity,
        expiry_date,
        created_by
    ) VALUES (
        p_product_id,
        NULL,  -- Will be updated after we get the ID
        p_quantity,
        p_quantity,  -- original_quantity same as quantity initially
        p_expiry_date,
        auth.uid()
    )
    RETURNING id INTO v_batch_id;

    -- Step 2: Generate the batch number using the pattern BT + MMDDYY + - + incremental_number
    -- Format current date as MMDDYY (e.g., 100425 for October 4, 2025)
    v_date_string := TO_CHAR(CURRENT_DATE, 'MMDDYY');
    
    -- Get the next incremental number for today's date
    -- Count existing batches with today's date pattern
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(
                batch_number FROM 'BT' || v_date_string || '-(\\d+)'
            ) AS INTEGER
        )
    ), 0) + 1
    INTO v_batch_increment
    FROM product_batches 
    WHERE batch_number LIKE 'BT' || v_date_string || '-%'
    AND batch_number ~ ('^BT' || v_date_string || '-[0-9]+$');
    
    v_generated_batch_number := 'BT' || v_date_string || '-' || v_batch_increment::TEXT;

    -- Step 3: Update the batch record with the generated batch number
    UPDATE product_batches 
    SET batch_number = v_generated_batch_number
    WHERE id = v_batch_id;

    -- Step 4: Update product stock
    UPDATE products 
    SET 
        stock_in_pieces = v_new_stock,
        updated_at = NOW()
    WHERE id = p_product_id;

    -- Step 5: Log the inventory change (simplified)
    INSERT INTO inventory_logs (
        product_id,
        batch_id,
        action,
        quantity_change,
        new_quantity,
        reason,
        created_by
    ) VALUES (
        p_product_id,
        v_batch_id,
        'BATCH_ADDED',
        p_quantity,
        v_new_stock,
        'New batch added: ' || v_generated_batch_number,
        auth.uid()
    );

    -- Build result
    v_result := json_build_object(
        'success', true,
        'batch_id', v_batch_id,
        'product_id', p_product_id,
        'quantity_added', p_quantity,
        'previous_stock', v_current_stock,
        'new_stock', v_new_stock,
        'batch_number', v_generated_batch_number,
        'expiry_date', p_expiry_date
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in add_product_batch: %', SQLERRM;
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'debug', 'Exception caught in function'
        );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_product_batch(UUID, INTEGER, DATE) TO authenticated;

-- ========================================
-- ✅ SIMPLIFIED AUTOMATED BATCH NUMBERING!
-- ========================================

SELECT '✅ SIMPLIFIED AUTOMATED BATCH NUMBERING SYSTEM SETUP COMPLETE!' as message,
       'Function now matches your existing table structure' as info;