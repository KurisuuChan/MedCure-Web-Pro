-- =================================================
-- 🚨 CRITICAL FIX: CORRECT PARAMETER TYPES FOR TRANSACTION EDITING
-- Run this to fix the parameter type mismatch
-- =================================================

-- Drop the existing functions with all possible signatures
DROP FUNCTION IF EXISTS edit_transaction_with_stock_management(BIGINT, JSONB, JSONB);
DROP FUNCTION IF EXISTS edit_transaction_with_stock_management(UUID, JSONB, JSONB);

-- Recreate with correct UUID parameter type and return type
CREATE OR REPLACE FUNCTION edit_transaction_with_stock_management(
    p_transaction_id UUID,
    p_new_items JSONB,
    p_edit_data JSONB
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    transaction_id UUID
) AS $$
DECLARE
    item JSONB;
    current_stock INTEGER;
    pieces_needed INTEGER;
    product_pieces_per_sheet INTEGER;
    product_sheets_per_box INTEGER;
    product_name TEXT;
BEGIN
    -- Start transaction
    BEGIN
        -- 1. Update the sales record
        UPDATE sales SET
            total_amount = (p_edit_data->>'total_amount')::DECIMAL,
            subtotal_before_discount = (p_edit_data->>'subtotal_before_discount')::DECIMAL,
            discount_type = COALESCE(p_edit_data->>'discount_type', 'none'),
            discount_percentage = COALESCE((p_edit_data->>'discount_percentage')::DECIMAL, 0),
            discount_amount = COALESCE((p_edit_data->>'discount_amount')::DECIMAL, 0),
            pwd_senior_id = (p_edit_data->>'pwd_senior_id')::UUID,
            is_edited = true,
            edited_at = NOW(),
            edited_by = (p_edit_data->>'edited_by')::UUID,
            edit_reason = p_edit_data->>'edit_reason'
        WHERE id = p_transaction_id;
        
        -- 2. Delete old sale items (this will trigger stock restoration)
        DELETE FROM sale_items WHERE sale_id = p_transaction_id;
        
        -- 3. Validate and insert new items
        FOR item IN SELECT * FROM jsonb_array_elements(p_new_items)
        LOOP
            -- Get product details
            SELECT stock_in_pieces, pieces_per_sheet, sheets_per_box, name
            INTO current_stock, product_pieces_per_sheet, product_sheets_per_box, product_name
            FROM products 
            WHERE id = (item->>'product_id')::UUID;
            
            -- Calculate pieces needed
            CASE COALESCE(item->>'unit_type', 'piece')
                WHEN 'piece' THEN
                    pieces_needed := (item->>'quantity')::INTEGER;
                WHEN 'sheet' THEN
                    pieces_needed := (item->>'quantity')::INTEGER * COALESCE(product_pieces_per_sheet, 1);
                WHEN 'box' THEN
                    pieces_needed := (item->>'quantity')::INTEGER * COALESCE(product_pieces_per_sheet, 1) * COALESCE(product_sheets_per_box, 1);
                ELSE
                    pieces_needed := (item->>'quantity')::INTEGER;
            END CASE;
            
            -- Check stock availability
            IF current_stock < pieces_needed THEN
                RAISE EXCEPTION 'Insufficient stock for product %: needed %, available %', 
                    product_name, pieces_needed, current_stock;
            END IF;
            
            -- Insert new sale item
            INSERT INTO sale_items (
                sale_id,
                product_id,
                quantity,
                unit_type,
                unit_price,
                total_price
            ) VALUES (
                p_transaction_id,
                (item->>'product_id')::UUID,
                (item->>'quantity')::INTEGER,
                COALESCE(item->>'unit_type', 'piece'),
                (item->>'unit_price')::DECIMAL,
                (item->>'total_price')::DECIMAL
            );
            
            -- Update stock (this will trigger the normal stock deduction)
            UPDATE products 
            SET stock_in_pieces = stock_in_pieces - pieces_needed
            WHERE id = (item->>'product_id')::UUID;
            
            -- Log stock movement
            INSERT INTO stock_movements (
                product_id,
                user_id,
                movement_type,
                quantity,
                reason,
                reference_type,
                reference_id,
                stock_before,
                stock_after
            ) VALUES (
                (item->>'product_id')::UUID,
                (p_edit_data->>'edited_by')::UUID,
                'out',
                pieces_needed,
                'Stock deducted during transaction edit',
                'sale_edit',
                p_transaction_id,
                current_stock,
                current_stock - pieces_needed
            );
        END LOOP;
        
        -- Return success
        RETURN QUERY SELECT true, 'Transaction edited successfully'::TEXT, p_transaction_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback and return error
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- ✅ PARAMETER TYPE FIX COMPLETE!
-- =================================================

SELECT 'Parameter types corrected - UUID instead of BIGINT!' as status;
