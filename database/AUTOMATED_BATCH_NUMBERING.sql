-- ============================================
-- AUTOMATED BATCH NUMBERING SYSTEM
-- ============================================
-- Execute this in your Supabase SQL Editor
-- This replaces the manual batch numbering with an automated system

-- Drop the existing function
DROP FUNCTION IF EXISTS add_product_batch(UUID, INTEGER, TEXT, DATE);

-- Create the new automated batch numbering function
CREATE OR REPLACE FUNCTION add_product_batch(
    p_product_id UUID,
    p_quantity INTEGER,
    p_expiry_date DATE DEFAULT NULL,
    p_supplier TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
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
BEGIN
    -- Validate inputs
    IF p_product_id IS NULL OR p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product ID and positive quantity are required'
        );
    END IF;

    -- Check if product exists
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product not found'
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

    -- Step 2: Generate the batch number using the pattern BT + YYMMDD + - + batch_id
    -- Format current date as YYMMDD (e.g., 250924 for September 24, 2025)
    v_date_string := TO_CHAR(CURRENT_DATE, 'YYMMDD');
    v_generated_batch_number := 'BT' || v_date_string || '-' || v_batch_id::TEXT;

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

    -- Step 5: Log the inventory change
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
        'New batch added: ' || v_generated_batch_number || 
        CASE 
            WHEN p_supplier IS NOT NULL AND p_supplier != '' THEN ' (Supplier: ' || p_supplier || ')'
            ELSE ''
        END ||
        CASE 
            WHEN p_notes IS NOT NULL AND p_notes != '' THEN ' - Notes: ' || p_notes
            ELSE ''
        END,
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
        'expiry_date', p_expiry_date,
        'supplier', p_supplier,
        'notes', p_notes
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_product_batch(UUID, INTEGER, DATE, TEXT, TEXT) TO authenticated;

-- ========================================
-- ✅ AUTOMATED BATCH NUMBERING COMPLETE!
-- ========================================

-- Test the function (uncomment and replace with a real product ID to test)
/*
SELECT add_product_batch(
    'your-product-id'::UUID,
    50,
    '2025-12-31'::DATE,
    'Test Supplier',
    'Test batch with automated numbering'
);
*/

SELECT '✅ AUTOMATED BATCH NUMBERING SYSTEM SETUP COMPLETE!' as message,
       'Batch numbers will now be generated automatically in format: BT + YYMMDD + - + ID' as pattern_info;