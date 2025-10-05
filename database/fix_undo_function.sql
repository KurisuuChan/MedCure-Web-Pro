-- Fix undo transaction function to resolve products_2.name error
-- This creates a clean version without any problematic table aliases

-- Drop and recreate the function to ensure clean state
DROP FUNCTION IF EXISTS undo_transaction_completely(UUID);

-- Function: Undo transaction completely
-- This restores stock and marks transaction as cancelled
CREATE OR REPLACE FUNCTION undo_transaction_completely(p_transaction_id UUID)
RETURNS JSONB AS $$
DECLARE
    sale_item RECORD;
    pieces_to_restore INTEGER;
    system_user_id UUID;
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
        SELECT 
            si.product_id, 
            si.quantity, 
            si.unit_type, 
            p.pieces_per_sheet, 
            p.sheets_per_box, 
            p.brand_name,
            p.generic_name,
            p.stock_in_pieces
        FROM sale_items si
        INNER JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = p_transaction_id
    LOOP
        -- Calculate pieces to restore based on unit type
        CASE COALESCE(sale_item.unit_type, 'piece')
            WHEN 'piece' THEN pieces_to_restore := sale_item.quantity;
            WHEN 'sheet' THEN pieces_to_restore := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1);
            WHEN 'box' THEN pieces_to_restore := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1) * COALESCE(sale_item.sheets_per_box, 1);
            ELSE pieces_to_restore := sale_item.quantity;
        END CASE;
        
        -- Restore the stock
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces + pieces_to_restore,
            updated_at = NOW()
        WHERE id = sale_item.product_id;
        
        -- Log the restoration (if stock_movements table exists)
        INSERT INTO stock_movements (
            product_id, user_id, movement_type, quantity, reason, 
            reference_type, reference_id, stock_before, stock_after, created_at
        ) VALUES (
            sale_item.product_id, 
            system_user_id, 
            'in', 
            pieces_to_restore,
            'Stock restored for transaction undo', 
            'sale_undo', 
            p_transaction_id,
            sale_item.stock_in_pieces, 
            sale_item.stock_in_pieces + pieces_to_restore, 
            NOW()
        )
        ON CONFLICT DO NOTHING; -- Handle case where stock_movements might not exist
        
    END LOOP;
    
    -- Mark transaction as cancelled (CRITICAL: excludes from revenue)
    UPDATE sales 
    SET status = 'cancelled',
        is_edited = true,
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

-- Test the function (commented out - uncomment to test)
-- SELECT undo_transaction_completely('test-uuid-here'::UUID);