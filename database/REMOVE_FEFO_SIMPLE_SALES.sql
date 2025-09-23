-- ============================================
-- REMOVE FEFO FUNCTIONALITY
-- ============================================
-- This will drop the FEFO function and create a simple stock deduction system

-- Drop the FEFO function completely
DROP FUNCTION IF EXISTS process_sale_fefo(UUID, INTEGER, UUID, UUID, TEXT);

-- Create a simple stock deduction function instead
CREATE OR REPLACE FUNCTION process_simple_sale(
    p_product_id UUID,
    p_quantity_to_sell INTEGER,
    p_user_id UUID DEFAULT NULL,
    p_sale_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
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
    -- Input validation
    IF p_product_id IS NULL THEN
        RAISE EXCEPTION 'Product ID cannot be null';
    END IF;
    
    IF p_quantity_to_sell <= 0 THEN
        RAISE EXCEPTION 'Quantity to sell must be greater than 0';
    END IF;

    -- Check if product exists and get current stock
    SELECT COALESCE(stock_in_pieces, 0) 
    INTO v_current_stock 
    FROM products 
    WHERE id = p_product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % does not exist', p_product_id;
    END IF;

    -- Check if we have enough stock
    IF v_current_stock < p_quantity_to_sell THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_quantity_to_sell;
    END IF;

    -- Calculate new stock
    v_new_stock := v_current_stock - p_quantity_to_sell;

    -- Update the product stock
    UPDATE products 
    SET stock_in_pieces = v_new_stock,
        updated_at = NOW()
    WHERE id = p_product_id;

    -- Build the result JSON
    v_result := jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'quantity_sold', p_quantity_to_sell,
        'previous_stock', v_current_stock,
        'new_stock', v_new_stock,
        'sale_id', p_sale_id,
        'processed_at', NOW()
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Simple sale processing failed: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_simple_sale(UUID, INTEGER, UUID, UUID, TEXT) TO authenticated;

-- ========================================
-- ✅ FEFO REMOVED - SIMPLE SALES READY!
-- ========================================

SELECT '✅ FEFO FUNCTIONALITY REMOVED!' as message,
       'Now using simple stock deduction without batch tracking complexity' as info;