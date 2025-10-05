-- Fix for refund functionality - Updated medicine structure columns
-- Run this in Supabase SQL Editor to fix the "column products_2.name does not exist" error

-- First, update the sales status check constraint to allow 'refunded'
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;
ALTER TABLE sales ADD CONSTRAINT sales_status_check 
    CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded'));

-- Drop and recreate the undo function with correct column references
DROP FUNCTION IF EXISTS undo_transaction_completely(UUID);

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
    -- FIXED: Using brand_name and generic_name instead of p.name
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
        
        -- Restore the stock
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces + pieces_to_restore,
            updated_at = NOW()
        WHERE id = sale_item.product_id;
        
        -- Try to log the restoration (handle case where stock_movements might not exist)
        BEGIN
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
            );
        EXCEPTION WHEN OTHERS THEN
            -- Ignore stock_movements errors if table doesn't exist or has issues
            NULL;
        END;
        
    END LOOP;
    
    -- Mark transaction as refunded (CRITICAL: excludes from revenue)
    UPDATE sales 
    SET status = 'refunded',
        is_edited = true,
        edited_at = NOW(),
        edit_reason = 'Transaction refunded and stock restored',
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
        'message', 'Failed to undo transaction: ' || SQLERRM
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Also fix the complete_transaction_with_stock function
CREATE OR REPLACE FUNCTION complete_transaction_with_stock(p_transaction_id UUID)
RETURNS JSONB AS $$
DECLARE
    sale_item RECORD;
    pieces_needed INTEGER;
    system_user_id UUID;
    result JSONB;
BEGIN
    -- Get system user
    SELECT id INTO system_user_id FROM users LIMIT 1;
    
    -- Check if transaction exists and is pending
    IF NOT EXISTS (SELECT 1 FROM sales WHERE id = p_transaction_id AND status = 'pending') THEN
        result := jsonb_build_object(
            'success', false,
            'message', 'Transaction not found or not pending'
        );
        RETURN result;
    END IF;
    
    -- Deduct stock for each item in the transaction
    -- FIXED: Using brand_name and generic_name instead of p.name
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
        
        -- Final stock check with proper product name
        IF sale_item.stock_in_pieces < pieces_needed THEN
            RAISE EXCEPTION 'Insufficient stock for %: needed %, available %', 
                COALESCE(sale_item.brand_name, sale_item.generic_name, 'Unknown Product'), 
                pieces_needed, 
                sale_item.stock_in_pieces;
        END IF;
        
        -- Deduct the stock
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces - pieces_needed,
            updated_at = NOW()
        WHERE id = sale_item.product_id;
        
    END LOOP;
    
    -- Mark transaction as completed
    UPDATE sales 
    SET status = 'completed',
        completed_at = NOW(),
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
        'message', 'Failed to complete transaction: ' || SQLERRM
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;