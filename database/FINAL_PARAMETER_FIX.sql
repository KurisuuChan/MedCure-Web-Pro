-- =================================================
-- 🚨 URGENT: FINAL PARAMETER TYPE FIX
-- Copy and run this complete script to fix the function
-- =================================================

-- Drop ALL existing versions of the function
DROP FUNCTION IF EXISTS edit_transaction_with_stock_management(BIGINT, JSONB, JSONB);
DROP FUNCTION IF EXISTS edit_transaction_with_stock_management(UUID, JSONB, JSONB);

-- Create the corrected function with proper UUID types
CREATE FUNCTION edit_transaction_with_stock_management(
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
    BEGIN
        UPDATE sales SET
            total_amount = (p_edit_data->>'total_amount')::DECIMAL,
            subtotal_before_discount = (p_edit_data->>'subtotal_before_discount')::DECIMAL,
            discount_type = COALESCE(p_edit_data->>'discount_type', 'none'),
            discount_percentage = COALESCE((p_edit_data->>'discount_percentage')::DECIMAL, 0),
            discount_amount = COALESCE((p_edit_data->>'discount_amount')::DECIMAL, 0),
            pwd_senior_id = p_edit_data->>'pwd_senior_id',
            is_edited = true,
            edited_at = NOW(),
            edited_by = (p_edit_data->>'edited_by')::UUID,
            edit_reason = p_edit_data->>'edit_reason'
        WHERE id = p_transaction_id;
        
        DELETE FROM sale_items WHERE sale_id = p_transaction_id;
        
        FOR item IN SELECT * FROM jsonb_array_elements(p_new_items)
        LOOP
            SELECT stock_in_pieces, pieces_per_sheet, sheets_per_box, name
            INTO current_stock, product_pieces_per_sheet, product_sheets_per_box, product_name
            FROM products 
            WHERE id = (item->>'product_id')::UUID;
            
            CASE COALESCE(item->>'unit_type', 'piece')
                WHEN 'piece' THEN pieces_needed := (item->>'quantity')::INTEGER;
                WHEN 'sheet' THEN pieces_needed := (item->>'quantity')::INTEGER * COALESCE(product_pieces_per_sheet, 1);
                WHEN 'box' THEN pieces_needed := (item->>'quantity')::INTEGER * COALESCE(product_pieces_per_sheet, 1) * COALESCE(product_sheets_per_box, 1);
                ELSE pieces_needed := (item->>'quantity')::INTEGER;
            END CASE;
            
            IF current_stock < pieces_needed THEN
                RAISE EXCEPTION 'Insufficient stock for product %: needed %, available %', 
                    product_name, pieces_needed, current_stock;
            END IF;
            
            INSERT INTO sale_items (
                sale_id, product_id, quantity, unit_type, unit_price, total_price
            ) VALUES (
                p_transaction_id, (item->>'product_id')::UUID, (item->>'quantity')::INTEGER,
                COALESCE(item->>'unit_type', 'piece'), (item->>'unit_price')::DECIMAL, (item->>'total_price')::DECIMAL
            );
            
            UPDATE products SET stock_in_pieces = stock_in_pieces - pieces_needed
            WHERE id = (item->>'product_id')::UUID;
            
            INSERT INTO stock_movements (
                product_id, user_id, movement_type, quantity, reason, reference_type, reference_id, stock_before, stock_after
            ) VALUES (
                (item->>'product_id')::UUID, (p_edit_data->>'edited_by')::UUID, 'out', pieces_needed,
                'Stock deducted during transaction edit', 'sale_edit', p_transaction_id, current_stock, current_stock - pieces_needed
            );
        END LOOP;
        
        RETURN QUERY SELECT true, 'Transaction edited successfully'::TEXT, p_transaction_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- ✅ FINAL FIX COMPLETE!
-- =================================================

SELECT 'Function recreated with correct UUID parameter types!' as status;
