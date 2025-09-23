-- ============================================
-- COMPLETE FEFO REMOVAL & SIMPLE SYSTEM RESTORE
-- ============================================
-- This will completely remove FEFO and restore simple stock management

-- Step 1: Drop all FEFO-related functions
DROP FUNCTION IF EXISTS process_sale_fefo(UUID, INTEGER, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS process_fefo_sale(UUID, INTEGER, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS process_simple_sale(UUID, INTEGER, UUID, UUID, TEXT);

-- Step 2: Create a basic stock update function (optional - can use direct SQL)
CREATE OR REPLACE FUNCTION update_product_stock(
    p_product_id UUID,
    p_quantity_change INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_stock INTEGER := 0;
    v_new_stock INTEGER := 0;
    v_result JSONB;
BEGIN
    -- Get current stock
    SELECT COALESCE(stock_in_pieces, 0) 
    INTO v_current_stock 
    FROM products 
    WHERE id = p_product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % does not exist', p_product_id;
    END IF;

    -- Calculate new stock (negative for sales, positive for additions)
    v_new_stock := v_current_stock + p_quantity_change;

    -- Prevent negative stock
    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, ABS(p_quantity_change);
    END IF;

    -- Update the stock
    UPDATE products 
    SET stock_in_pieces = v_new_stock,
        updated_at = NOW()
    WHERE id = p_product_id;

    -- Return result
    v_result := jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'previous_stock', v_current_stock,
        'new_stock', v_new_stock,
        'quantity_change', p_quantity_change
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Stock update failed: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_product_stock(UUID, INTEGER) TO authenticated;

-- Test message
SELECT '✅ FEFO COMPLETELY REMOVED!' as message,
       'System now uses simple direct stock updates' as info;