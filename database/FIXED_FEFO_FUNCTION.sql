-- ============================================
-- FIXED FEFO SALES FUNCTION 
-- ============================================
-- This version matches your existing inventory_logs table structure
-- Updated to use 'action' instead of 'action_type' and other column corrections

-- Drop existing function
DROP FUNCTION IF EXISTS process_sale_fefo(UUID, INTEGER, UUID, UUID, TEXT);

-- FEFO (First-Expired, First-Out) Sales Processing RPC Function
-- This function automatically processes sales by deducting stock from batches that expire soonest first
CREATE OR REPLACE FUNCTION process_sale_fefo(
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
    v_total_available INTEGER := 0;
    v_remaining_to_sell INTEGER := p_quantity_to_sell;
    v_batch_record RECORD;
    v_deduct_from_batch INTEGER;
    v_batches_affected INTEGER := 0;
    v_total_deducted INTEGER := 0;
    v_new_total_stock INTEGER := 0;
    v_result JSONB;
    v_affected_batches JSONB[] := '{}';
    v_current_product_stock INTEGER := 0;
BEGIN
    -- Input validation
    IF p_product_id IS NULL THEN
        RAISE EXCEPTION 'Product ID cannot be null';
    END IF;
    
    IF p_quantity_to_sell <= 0 THEN
        RAISE EXCEPTION 'Quantity to sell must be greater than 0';
    END IF;

    -- Check if product exists
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id) THEN
        RAISE EXCEPTION 'Product with ID % does not exist', p_product_id;
    END IF;

    -- Get current product stock
    SELECT COALESCE(stock_in_pieces, 0) 
    INTO v_current_product_stock 
    FROM products 
    WHERE id = p_product_id;

    -- Calculate total available stock from all batches
    SELECT COALESCE(SUM(quantity), 0) 
    INTO v_total_available 
    FROM product_batches 
    WHERE product_id = p_product_id AND quantity > 0;

    -- Check if we have enough stock
    IF v_total_available < p_quantity_to_sell THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_total_available, p_quantity_to_sell;
    END IF;

    -- Process batches in FEFO order (oldest expiry dates first, then oldest created_at)
    FOR v_batch_record IN
        SELECT id, batch_number, quantity, expiry_date, created_at
        FROM product_batches 
        WHERE product_id = p_product_id 
        AND quantity > 0
        ORDER BY 
            CASE WHEN expiry_date IS NULL THEN '9999-12-31'::date ELSE expiry_date END ASC,
            created_at ASC
    LOOP
        -- Exit if we've sold everything we need
        EXIT WHEN v_remaining_to_sell <= 0;
        
        -- Determine how much to deduct from this batch
        v_deduct_from_batch := LEAST(v_batch_record.quantity, v_remaining_to_sell);
        
        -- Update the batch quantity
        UPDATE product_batches 
        SET quantity = quantity - v_deduct_from_batch,
            updated_at = NOW()
        WHERE id = v_batch_record.id;

        -- Add to affected batches array
        v_affected_batches := v_affected_batches || jsonb_build_object(
            'batch_id', v_batch_record.id,
            'batch_number', v_batch_record.batch_number,
            'quantity_deducted', v_deduct_from_batch,
            'remaining_quantity', v_batch_record.quantity - v_deduct_from_batch,
            'expiry_date', v_batch_record.expiry_date
        );

        -- Update counters
        v_remaining_to_sell := v_remaining_to_sell - v_deduct_from_batch;
        v_total_deducted := v_total_deducted + v_deduct_from_batch;
        v_batches_affected := v_batches_affected + 1;

        -- Create inventory log entry for this batch deduction
        -- FIXED: Using exact column names from your inventory_logs table
        INSERT INTO inventory_logs (
            product_id,
            batch_id,
            action,
            quantity_change,
            previous_quantity,
            new_quantity,
            reason,
            created_by
        ) VALUES (
            p_product_id,
            v_batch_record.id,
            'SALE',
            -v_deduct_from_batch,  -- Negative for sale
            v_batch_record.quantity,  -- Previous quantity before deduction
            v_batch_record.quantity - v_deduct_from_batch,  -- New quantity after deduction
            COALESCE(p_notes, 'FEFO sale deduction from batch ' || v_batch_record.batch_number),
            COALESCE(p_user_id, auth.uid())
        );

    END LOOP;

    -- Calculate new total stock for the product
    v_new_total_stock := v_current_product_stock - v_total_deducted;

    -- Update the main product stock
    UPDATE products 
    SET stock_in_pieces = v_new_total_stock,
        updated_at = NOW()
    WHERE id = p_product_id;

    -- Create a summary inventory log for the entire sale
    INSERT INTO inventory_logs (
        product_id,
        batch_id,        -- NULL for product-level operations
        action,
        quantity_change,
        previous_quantity,
        new_quantity,
        reason,
        created_by
    ) VALUES (
        p_product_id,
        NULL,
        'SALE_COMPLETE',
        -v_total_deducted,
        v_current_product_stock,  -- Previous stock before sale
        v_new_total_stock,        -- New stock after sale
        COALESCE(p_notes, 'FEFO sale completed - ' || v_batches_affected || ' batches affected'),
        COALESCE(p_user_id, auth.uid())
    );

    -- Build the result JSON
    v_result := jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'total_quantity_sold', v_total_deducted,
        'batches_affected', v_batches_affected,
        'remaining_stock', v_new_total_stock,
        'affected_batches', v_affected_batches,
        'sale_id', p_sale_id,
        'processed_at', NOW()
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback any changes and return error
        RAISE EXCEPTION 'FEFO sale processing failed: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_sale_fefo(UUID, INTEGER, UUID, UUID, TEXT) TO authenticated;

-- ========================================
-- ✅ FIXED FEFO FUNCTION READY!
-- ========================================

SELECT '✅ FIXED FEFO FUNCTION SETUP COMPLETE!' as message,
       'Function now uses correct inventory_logs column names: action, new_quantity, reason, created_by' as info;