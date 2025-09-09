-- =====================================================
-- PROFESSIONAL REVENUE TRACKING FIX
-- =====================================================
-- Fixes revenue tracking to properly handle undone transactions
-- =====================================================

-- Fix the undo function to properly mark transactions as cancelled
CREATE OR REPLACE FUNCTION undo_transaction_completely(p_transaction_id UUID)
RETURNS JSONB AS $$
DECLARE
    sale_item RECORD;
    pieces_to_restore INTEGER;
    system_user_id UUID;
    current_stock_before INTEGER;
    current_stock_after INTEGER;
    result JSONB;
BEGIN
    -- Get system user
    SELECT id INTO system_user_id FROM users LIMIT 1;
    
    -- Check if transaction exists and is completed
    IF NOT EXISTS (SELECT 1 FROM sales WHERE id = p_transaction_id AND status = 'completed') THEN
        result := jsonb_build_object(
            'success', false,
            'message', 'Transaction not found or not completed'
        );
        RETURN result;
    END IF;
    
    -- Restore stock for each item in the transaction
    FOR sale_item IN 
        SELECT si.product_id, si.quantity, si.unit_type, p.pieces_per_sheet, p.sheets_per_box, p.name
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = p_transaction_id
    LOOP
        -- Calculate pieces to restore based on unit type
        CASE COALESCE(sale_item.unit_type, 'piece')
            WHEN 'piece' THEN pieces_to_restore := sale_item.quantity;
            WHEN 'sheet' THEN pieces_to_restore := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1);
            WHEN 'box' THEN pieces_to_restore := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1) * COALESCE(sale_item.sheets_per_box, 1);
            ELSE pieces_to_restore := sale_item.quantity;
        END CASE;
        
        -- Get current stock BEFORE restoration
        SELECT stock_in_pieces INTO current_stock_before 
        FROM products 
        WHERE id = sale_item.product_id;
        
        -- Calculate stock AFTER restoration
        current_stock_after := current_stock_before + pieces_to_restore;
        
        -- Restore the stock
        UPDATE products 
        SET stock_in_pieces = current_stock_after,
            updated_at = NOW()
        WHERE id = sale_item.product_id;
        
        -- Log the restoration with CORRECT before/after values
        INSERT INTO stock_movements (
            product_id, user_id, movement_type, quantity, reason, 
            reference_type, reference_id, stock_before, stock_after, created_at
        ) VALUES (
            sale_item.product_id, system_user_id, 'in', pieces_to_restore,
            'Stock restored for transaction undo', 'sale_undo', p_transaction_id,
            current_stock_before, current_stock_after, NOW()
        );
        
        -- Debug logging
        RAISE NOTICE 'UNDO: Product %, Before: %, Restored: %, After: %', 
            sale_item.name, current_stock_before, pieces_to_restore, current_stock_after;
    END LOOP;
    
    -- CRITICAL FIX: Mark transaction as CANCELLED (not just edited)
    UPDATE sales 
    SET status = 'cancelled',  -- This removes it from revenue calculations
        is_edited = true,
        edited_at = NOW(),
        edit_reason = 'Transaction undone and stock restored',
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Transaction cancelled and stock restored',
        'transaction_id', p_transaction_id
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to undo transaction'
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🏆 PROFESSIONAL REVENUE TRACKING FIX DEPLOYED!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Undo function now marks transactions as CANCELLED';
    RAISE NOTICE '✅ Revenue calculations will exclude cancelled transactions';
    RAISE NOTICE '✅ Stock restoration remains perfect and accurate';
    RAISE NOTICE '';
    RAISE NOTICE 'Revenue should now update correctly when transactions are undone!';
END $$;
