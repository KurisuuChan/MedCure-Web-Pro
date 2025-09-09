-- =====================================================
-- FIXED STOCK RESTORATION WITH CORRECT CALCULATIONS
-- =====================================================

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
    
    -- Mark transaction as undone (use edit flags instead of changing status)
    UPDATE sales 
    SET is_edited = true,
        edited_at = NOW(),
        edit_reason = 'Transaction undone and stock restored',
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Transaction undone and stock restored',
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

-- Also fix the complete_transaction_with_stock function for consistent logging
CREATE OR REPLACE FUNCTION complete_transaction_with_stock(p_transaction_id UUID)
RETURNS JSONB AS $$
DECLARE
    sale_item RECORD;
    pieces_needed INTEGER;
    current_stock_before INTEGER;
    current_stock_after INTEGER;
    system_user_id UUID;
    result JSONB;
BEGIN
    -- Get system user
    SELECT id INTO system_user_id FROM users LIMIT 1;
    
    -- Deduct stock for each item in the transaction
    FOR sale_item IN 
        SELECT si.product_id, si.quantity, si.unit_type, p.pieces_per_sheet, p.sheets_per_box, p.name
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = p_transaction_id
    LOOP
        -- Calculate pieces needed based on unit type
        CASE COALESCE(sale_item.unit_type, 'piece')
            WHEN 'piece' THEN pieces_needed := sale_item.quantity;
            WHEN 'sheet' THEN pieces_needed := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1);
            WHEN 'box' THEN pieces_needed := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1) * COALESCE(sale_item.sheets_per_box, 1);
            ELSE pieces_needed := sale_item.quantity;
        END CASE;
        
        -- Get current stock BEFORE deduction
        SELECT stock_in_pieces INTO current_stock_before 
        FROM products 
        WHERE id = sale_item.product_id;
        
        -- Final stock check
        IF current_stock_before < pieces_needed THEN
            RAISE EXCEPTION 'Insufficient stock for %: needed %, available %', 
                sale_item.name, pieces_needed, current_stock_before;
        END IF;
        
        -- Calculate stock AFTER deduction
        current_stock_after := current_stock_before - pieces_needed;
        
        -- Deduct stock (SINGLE DEDUCTION)
        UPDATE products 
        SET stock_in_pieces = current_stock_after,
            updated_at = NOW()
        WHERE id = sale_item.product_id;
        
        -- Log stock movement with CORRECT before/after values
        INSERT INTO stock_movements (
            product_id, user_id, movement_type, quantity, reason, 
            reference_type, reference_id, stock_before, stock_after, created_at
        ) VALUES (
            sale_item.product_id, system_user_id, 'out', pieces_needed,
            'Stock deducted for completed transaction', 'sale_complete', p_transaction_id,
            current_stock_before, current_stock_after, NOW()
        );
        
        -- Debug logging
        RAISE NOTICE 'DEDUCT: Product %, Before: %, Deducted: %, After: %', 
            sale_item.name, current_stock_before, pieces_needed, current_stock_after;
    END LOOP;
    
    -- Mark transaction as completed
    UPDATE sales 
    SET status = 'completed',
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Transaction completed and stock deducted',
        'transaction_id', p_transaction_id
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to complete transaction'
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '🔧 STOCK CALCULATION FIX DEPLOYED!';
    RAISE NOTICE '✅ Fixed incorrect stock_before/stock_after logging';
    RAISE NOTICE '✅ Added proper stock value calculations';
    RAISE NOTICE '✅ Added debug logging to track stock changes';
    RAISE NOTICE '';
    RAISE NOTICE 'Stock should now restore EXACTLY to original values';
END $$;
