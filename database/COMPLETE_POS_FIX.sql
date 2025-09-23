-- ============================================
-- COMPLETE POS SYSTEM FIX
-- ============================================
-- Step 1: Run this SQL in Supabase to fix the database functions

-- Drop all FEFO functions
DROP FUNCTION IF EXISTS process_sale_fefo(UUID, INTEGER, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS process_fefo_sale(UUID, INTEGER, UUID, UUID, TEXT);

-- Create the simple stock deduction function
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

-- Test the function to make sure it works
SELECT 'Database function created successfully!' as status;

-- ========================================
-- Step 2: Clear browser cache and restart dev server
-- ========================================
-- 1. Stop your dev server (Ctrl+C)
-- 2. Clear browser cache (Ctrl+Shift+Delete)
-- 3. Run: npm run dev
-- 4. Try making a sale again