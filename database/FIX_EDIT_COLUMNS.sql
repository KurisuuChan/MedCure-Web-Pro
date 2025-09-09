-- =====================================================
-- CORRECTED EDIT FUNCTION (FIXED COLUMN REFERENCES)
-- =====================================================

CREATE OR REPLACE FUNCTION edit_transaction_with_stock_management(p_edit_data JSONB)
RETURNS JSONB AS $$
DECLARE
    p_transaction_id UUID;
    p_new_items JSONB;
    transaction_status TEXT;
    item JSONB;
    result JSONB;
BEGIN
    -- Extract data
    p_transaction_id := (p_edit_data->>'transaction_id')::UUID;
    p_new_items := p_edit_data->'items';
    
    -- Check current status
    SELECT status INTO transaction_status 
    FROM sales 
    WHERE id = p_transaction_id;
    
    -- If transaction is completed, first undo it completely
    IF transaction_status = 'completed' THEN
        SELECT undo_transaction_completely(p_transaction_id) INTO result;
        IF NOT (result->>'success')::BOOLEAN THEN
            RETURN result;
        END IF;
    END IF;
    
    -- Update transaction details (ONLY EXISTING COLUMNS, PRESERVE ORIGINAL VALUES)
    UPDATE sales SET
        total_amount = (p_edit_data->>'total_amount')::DECIMAL,
        subtotal_before_discount = (p_edit_data->>'subtotal_before_discount')::DECIMAL,
        discount_type = COALESCE(p_edit_data->>'discount_type', 'none'),
        discount_percentage = COALESCE((p_edit_data->>'discount_percentage')::DECIMAL, 0),
        discount_amount = COALESCE((p_edit_data->>'discount_amount')::DECIMAL, 0),
        pwd_senior_id = p_edit_data->>'pwd_senior_id',
        payment_method = COALESCE(p_edit_data->>'payment_method', payment_method), -- Preserve original if not provided
        is_edited = true,
        edited_at = NOW(),
        edit_reason = p_edit_data->>'edit_reason',
        status = 'pending', -- Reset to pending for re-completion
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    -- Clear old sale items
    DELETE FROM sale_items WHERE sale_id = p_transaction_id;
    
    -- Insert new items (without deducting stock yet)
    FOR i IN 1..jsonb_array_length(p_new_items)
    LOOP
        item := p_new_items -> (i-1);
        
        INSERT INTO sale_items (
            id, sale_id, product_id, quantity, unit_type, unit_price, total_price, created_at
        ) VALUES (
            gen_random_uuid(), p_transaction_id, (item->>'product_id')::UUID, 
            (item->>'quantity')::INTEGER, COALESCE(item->>'unit_type', 'piece'), 
            (item->>'unit_price')::DECIMAL, (item->>'total_price')::DECIMAL, NOW()
        );
    END LOOP;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Transaction edited successfully - call complete_transaction_with_stock to finalize',
        'transaction_id', p_transaction_id
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to edit transaction'
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SUCCESS MESSAGES
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ CORRECTED EDIT FUNCTION DEPLOYED!';
    RAISE NOTICE '✅ Removed non-existent column references (amount_paid, change_amount)';
    RAISE NOTICE '✅ Edit function should now work without column errors';
END $$;
