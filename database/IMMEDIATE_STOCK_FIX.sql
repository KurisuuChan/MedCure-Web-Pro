-- =====================================================
-- IMMEDIATE STOCK CONFLICT RESOLUTION
-- =====================================================
-- This removes the competing functions causing double deductions
-- =====================================================

BEGIN;

-- =====================================================
-- REMOVE ALL COMPETING STOCK FUNCTIONS
-- =====================================================

-- Remove the competing functions that cause conflicts
DROP FUNCTION IF EXISTS process_sale_professional(UUID, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS log_stock_movement(UUID, INTEGER, TEXT, UUID, TEXT, TEXT) CASCADE;

-- Remove any triggers that might call these functions
DROP TRIGGER IF EXISTS professional_stock_management_trigger ON sales;

-- =====================================================
-- KEEP ONLY THE WORKING TRANSACTION EDITOR
-- =====================================================

-- The edit_transaction_with_stock_management function will remain
-- It already handles stock properly without conflicts

-- =====================================================
-- FIX THE STOCK RESTORATION ISSUE
-- =====================================================

-- Create a simple stock restoration function for undo operations
CREATE OR REPLACE FUNCTION restore_transaction_stock(p_transaction_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    item RECORD;
    current_stock INTEGER;
    pieces_to_restore INTEGER;
    product_pieces_per_sheet INTEGER;
    product_sheets_per_box INTEGER;
    system_user_id UUID;
BEGIN
    -- Get system user
    SELECT id INTO system_user_id FROM users LIMIT 1;
    
    -- Restore stock for each item in the transaction
    FOR item IN 
        SELECT si.product_id, si.quantity, si.unit_type, p.pieces_per_sheet, p.sheets_per_box, p.stock_in_pieces
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = p_transaction_id
    LOOP
        -- Calculate pieces to restore based on unit type
        CASE COALESCE(item.unit_type, 'piece')
            WHEN 'piece' THEN pieces_to_restore := item.quantity;
            WHEN 'sheet' THEN pieces_to_restore := item.quantity * COALESCE(item.pieces_per_sheet, 1);
            WHEN 'box' THEN pieces_to_restore := item.quantity * COALESCE(item.pieces_per_sheet, 1) * COALESCE(item.sheets_per_box, 1);
            ELSE pieces_to_restore := item.quantity;
        END CASE;
        
        -- Restore the stock
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces + pieces_to_restore,
            updated_at = NOW()
        WHERE id = item.product_id;
        
        -- Log the restoration
        INSERT INTO stock_movements (
            product_id, user_id, movement_type, quantity, reason, 
            reference_type, reference_id, stock_before, stock_after, created_at
        ) VALUES (
            item.product_id, system_user_id, 'in', pieces_to_restore,
            'Stock restored for transaction undo/edit', 'restore', p_transaction_id,
            item.stock_in_pieces, item.stock_in_pieces + pieces_to_restore, NOW()
        );
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ENHANCED TRANSACTION EDITOR WITH PROPER RESTORATION
-- =====================================================

CREATE OR REPLACE FUNCTION edit_transaction_with_stock_management_fixed(p_edit_data JSONB)
RETURNS TABLE(success BOOLEAN, message TEXT, transaction_id UUID) AS $$
DECLARE
    p_transaction_id UUID;
    p_new_items JSONB;
    item JSONB;
    current_stock INTEGER;
    pieces_needed INTEGER;
    product_pieces_per_sheet INTEGER;
    product_sheets_per_box INTEGER;
    product_name TEXT;
    system_user_id UUID;
BEGIN
    -- Extract data
    p_transaction_id := (p_edit_data->>'transaction_id')::UUID;
    p_new_items := p_edit_data->'items';
    
    -- Get system user
    SELECT id INTO system_user_id FROM users LIMIT 1;
    
    BEGIN
        -- STEP 1: RESTORE stock from current transaction (UNDO)
        PERFORM restore_transaction_stock(p_transaction_id);
        
        -- STEP 2: Update transaction details
        UPDATE sales SET
            total_amount = (p_edit_data->>'total_amount')::DECIMAL,
            subtotal_before_discount = (p_edit_data->>'subtotal_before_discount')::DECIMAL,
            discount_type = COALESCE(p_edit_data->>'discount_type', 'none'),
            discount_percentage = COALESCE((p_edit_data->>'discount_percentage')::DECIMAL, 0),
            discount_amount = COALESCE((p_edit_data->>'discount_amount')::DECIMAL, 0),
            pwd_senior_id = p_edit_data->>'pwd_senior_id', -- Fixed: No UUID casting
            payment_method = p_edit_data->>'payment_method',
            amount_paid = (p_edit_data->>'amount_paid')::DECIMAL,
            change_amount = (p_edit_data->>'change_amount')::DECIMAL,
            is_edited = true,
            edited_at = NOW(),
            edited_by = COALESCE((p_edit_data->>'edited_by')::UUID, system_user_id),
            edit_reason = p_edit_data->>'edit_reason',
            updated_at = NOW()
        WHERE id = p_transaction_id;
        
        -- STEP 3: Clear old sale items
        DELETE FROM sale_items WHERE sale_id = p_transaction_id;
        
        -- STEP 4: Insert new items and deduct stock
        FOR item IN SELECT * FROM jsonb_array_elements(p_new_items)
        LOOP
            -- Get product info
            SELECT stock_in_pieces, pieces_per_sheet, sheets_per_box, name
            INTO current_stock, product_pieces_per_sheet, product_sheets_per_box, product_name
            FROM products 
            WHERE id = (item->>'product_id')::UUID;
            
            -- Calculate pieces needed
            CASE COALESCE(item->>'unit_type', 'piece')
                WHEN 'piece' THEN pieces_needed := (item->>'quantity')::INTEGER;
                WHEN 'sheet' THEN pieces_needed := (item->>'quantity')::INTEGER * COALESCE(product_pieces_per_sheet, 1);
                WHEN 'box' THEN pieces_needed := (item->>'quantity')::INTEGER * COALESCE(product_pieces_per_sheet, 1) * COALESCE(product_sheets_per_box, 1);
                ELSE pieces_needed := (item->>'quantity')::INTEGER;
            END CASE;
            
            -- Check stock availability
            IF current_stock < pieces_needed THEN
                RAISE EXCEPTION 'Insufficient stock for product %: needed %, available %', 
                    product_name, pieces_needed, current_stock;
            END IF;
            
            -- Insert sale item
            INSERT INTO sale_items (
                id, sale_id, product_id, quantity, unit_type, unit_price, total_price, created_at
            ) VALUES (
                gen_random_uuid(), p_transaction_id, (item->>'product_id')::UUID, 
                (item->>'quantity')::INTEGER, COALESCE(item->>'unit_type', 'piece'), 
                (item->>'unit_price')::DECIMAL, (item->>'total_price')::DECIMAL, NOW()
            );
            
            -- Deduct stock (SINGLE DEDUCTION)
            UPDATE products 
            SET stock_in_pieces = stock_in_pieces - pieces_needed,
                updated_at = NOW()
            WHERE id = (item->>'product_id')::UUID;
            
            -- Log stock movement
            INSERT INTO stock_movements (
                product_id, user_id, movement_type, quantity, reason, reference_type, 
                reference_id, stock_before, stock_after, created_at
            ) VALUES (
                (item->>'product_id')::UUID, system_user_id, 'out', pieces_needed,
                'Stock deducted for transaction edit', 'sale_edit', p_transaction_id, 
                current_stock, current_stock - pieces_needed, NOW()
            );
        END LOOP;
        
        RETURN QUERY SELECT true, 'Transaction edited successfully'::TEXT, p_transaction_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Replace the old function
DROP FUNCTION IF EXISTS edit_transaction_with_stock_management(JSONB) CASCADE;

-- Create the replacement with correct signature
CREATE OR REPLACE FUNCTION edit_transaction_with_stock_management(p_edit_data JSONB)
RETURNS JSONB AS $$
DECLARE
    result_row RECORD;
    result JSONB;
BEGIN
    -- Call the fixed function
    SELECT * INTO result_row 
    FROM edit_transaction_with_stock_management_fixed(p_edit_data) 
    LIMIT 1;
    
    -- Return JSON result
    IF result_row.success THEN
        result := jsonb_build_object(
            'success', true,
            'message', result_row.message,
            'transaction_id', result_row.transaction_id
        );
    ELSE
        result := jsonb_build_object(
            'success', false,
            'message', result_row.message,
            'transaction_id', result_row.transaction_id
        );
    END IF;
    
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

COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'STOCK CONFLICT RESOLUTION COMPLETE';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE '✅ Removed competing functions causing double deductions';
    RAISE NOTICE '✅ Fixed stock restoration for undo/edit operations';
    RAISE NOTICE '✅ Single stock management system now active';
    RAISE NOTICE '✅ PWD123456 UUID casting issue resolved';
    RAISE NOTICE '=======================================================';
END $$;
