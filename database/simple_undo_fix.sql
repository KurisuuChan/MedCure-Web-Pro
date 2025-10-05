-- Simple fix for undo function - creates function with proper column references
CREATE OR REPLACE FUNCTION undo_transaction_completely(p_transaction_id UUID)
RETURNS JSONB AS $$
DECLARE
    sale_record RECORD;
    pieces_to_restore INTEGER;
    result JSONB;
BEGIN
    -- Check if transaction exists and is completed
    IF NOT EXISTS (SELECT 1 FROM sales WHERE id = p_transaction_id AND status = 'completed') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Transaction not found or not completed'
        );
    END IF;
    
    -- Restore stock for each item in the transaction
    FOR sale_record IN 
        SELECT 
            si.product_id, 
            si.quantity, 
            COALESCE(si.unit_type, 'piece') as unit_type,
            COALESCE(p.pieces_per_sheet, 1) as pieces_per_sheet,
            COALESCE(p.sheets_per_box, 1) as sheets_per_box
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = p_transaction_id
    LOOP
        -- Calculate pieces to restore based on unit type
        CASE sale_record.unit_type
            WHEN 'piece' THEN pieces_to_restore := sale_record.quantity;
            WHEN 'sheet' THEN pieces_to_restore := sale_record.quantity * sale_record.pieces_per_sheet;
            WHEN 'box' THEN pieces_to_restore := sale_record.quantity * sale_record.pieces_per_sheet * sale_record.sheets_per_box;
            ELSE pieces_to_restore := sale_record.quantity;
        END CASE;
        
        -- Restore the stock
        UPDATE products 
        SET 
            stock_in_pieces = stock_in_pieces + pieces_to_restore,
            updated_at = NOW()
        WHERE id = sale_record.product_id;
        
    END LOOP;
    
    -- Mark transaction as cancelled
    UPDATE sales 
    SET 
        status = 'cancelled',
        is_edited = true,
        edited_at = NOW(),
        edit_reason = 'Transaction undone and stock restored',
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Transaction undone and stock restored',
        'transaction_id', p_transaction_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to undo transaction: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;