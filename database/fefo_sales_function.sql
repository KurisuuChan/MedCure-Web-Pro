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
        SELECT 
            id,
            batch_number,
            quantity,
            expiry_date,
            created_at
        FROM product_batches 
        WHERE product_id = p_product_id 
            AND quantity > 0
        ORDER BY 
            -- NULL expiry dates last (treat as never expiring)
            CASE WHEN expiry_date IS NULL THEN 1 ELSE 0 END,
            expiry_date ASC NULLS LAST,
            created_at ASC
    LOOP
        -- Exit if we've sold all requested quantity
        EXIT WHEN v_remaining_to_sell <= 0;

        -- Calculate how much to deduct from this batch
        v_deduct_from_batch := LEAST(v_batch_record.quantity, v_remaining_to_sell);

        -- Update the batch quantity
        UPDATE product_batches 
        SET 
            quantity = quantity - v_deduct_from_batch,
            updated_at = NOW()
        WHERE id = v_batch_record.id;

        -- Track this batch deduction
        v_affected_batches := v_affected_batches || jsonb_build_object(
            'batch_id', v_batch_record.id,
            'batch_number', v_batch_record.batch_number,
            'expiry_date', v_batch_record.expiry_date,
            'original_quantity', v_batch_record.quantity,
            'deducted_quantity', v_deduct_from_batch,
            'remaining_quantity', v_batch_record.quantity - v_deduct_from_batch
        );

        -- Update counters
        v_remaining_to_sell := v_remaining_to_sell - v_deduct_from_batch;
        v_total_deducted := v_total_deducted + v_deduct_from_batch;
        v_batches_affected := v_batches_affected + 1;

        -- Create inventory log entry for this batch deduction
        INSERT INTO inventory_logs (
            product_id,
            batch_id,
            user_id,
            action_type,
            quantity_change,
            quantity_after,
            notes,
            reference_id,
            created_at
        ) VALUES (
            p_product_id,
            v_batch_record.id,
            p_user_id,
            'sale',
            -v_deduct_from_batch,  -- Negative for sale
            v_batch_record.quantity - v_deduct_from_batch,
            COALESCE(p_notes, 'FEFO sale deduction'),
            p_sale_id,
            NOW()
        );

    END LOOP;

    -- Calculate new total stock for the product
    SELECT COALESCE(SUM(quantity), 0) 
    INTO v_new_total_stock 
    FROM product_batches 
    WHERE product_id = p_product_id;

    -- Update the main products table with new total stock
    UPDATE products 
    SET 
        stock_in_pieces = v_new_total_stock,
        updated_at = NOW()
    WHERE id = p_product_id;

    -- Clean up empty batches (optional - you might want to keep them for history)
    -- DELETE FROM product_batches 
    -- WHERE product_id = p_product_id AND quantity = 0;

    -- Build result object
    v_result := jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'requested_quantity', p_quantity_to_sell,
        'actual_deducted', v_total_deducted,
        'remaining_stock', v_new_total_stock,
        'batches_affected', v_batches_affected,
        'batch_details', v_affected_batches,
        'processed_at', NOW()
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE EXCEPTION 'FEFO sale processing failed: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_sale_fefo(UUID, INTEGER, UUID, UUID, TEXT) TO authenticated;

-- Example usage:
-- SELECT process_sale_fefo(
--     'product-uuid-here'::UUID,
--     10,
--     'user-uuid-here'::UUID,
--     'sale-uuid-here'::UUID,
--     'POS Sale - Order #12345'
-- );