-- =================================================
-- 🚨 URGENT: DEPLOY STOCK MANAGEMENT FIXES
-- Copy and paste this entire script into your Supabase SQL Editor
-- =================================================

-- Run this to fix the critical stock management bug during transaction editing
-- This enables proper stock restoration when editing/undoing transactions

-- =================================================
-- 1. CREATE STOCK RESTORATION FUNCTION
-- =================================================

CREATE OR REPLACE FUNCTION restore_stock_on_edit()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
    pieces_to_restore INTEGER;
    product_pieces_per_sheet INTEGER;
    product_sheets_per_box INTEGER;
BEGIN
    -- Get current stock and product configuration
    SELECT stock_in_pieces, pieces_per_sheet, sheets_per_box 
    INTO current_stock, product_pieces_per_sheet, product_sheets_per_box
    FROM products 
    WHERE id = OLD.product_id;
    
    -- Calculate pieces to restore based on unit type
    CASE COALESCE(OLD.unit_type, 'piece')
        WHEN 'piece' THEN
            pieces_to_restore := OLD.quantity;
        WHEN 'sheet' THEN
            pieces_to_restore := OLD.quantity * COALESCE(product_pieces_per_sheet, 1);
        WHEN 'box' THEN
            pieces_to_restore := OLD.quantity * COALESCE(product_pieces_per_sheet, 1) * COALESCE(product_sheets_per_box, 1);
        ELSE
            pieces_to_restore := OLD.quantity;
    END CASE;
    
    -- Update product stock
    UPDATE products 
    SET stock_in_pieces = current_stock + pieces_to_restore
    WHERE id = OLD.product_id;
    
    -- Log the stock movement
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
        OLD.product_id,
        (SELECT user_id FROM sales WHERE id = OLD.sale_id),
        'in',
        pieces_to_restore,
        'Stock restored during transaction edit',
        'sale_edit',
        OLD.sale_id,
        current_stock,
        current_stock + pieces_to_restore
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- 2. MAIN STOCK-AWARE TRANSACTION EDITING FUNCTION
-- =================================================

CREATE OR REPLACE FUNCTION edit_transaction_with_stock_management(
    p_transaction_id BIGINT,
    p_new_items JSONB,
    p_edit_data JSONB
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    transaction_id BIGINT
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
            pwd_senior_id = (p_edit_data->>'pwd_senior_id')::BIGINT,
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
-- 3. CREATE TRIGGER FOR AUTOMATIC STOCK RESTORATION
-- =================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_item_delete ON sale_items;

-- Create new trigger
CREATE TRIGGER trigger_restore_stock_on_sale_item_delete
    BEFORE DELETE ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION restore_stock_on_edit();

-- =================================================
-- 4. CREATE AUDIT VIEW FOR STOCK MOVEMENTS
-- =================================================

-- Drop existing view if it exists to avoid column name conflicts
DROP VIEW IF EXISTS transaction_edit_stock_audit;

-- Create new audit view with correct column structure
CREATE VIEW transaction_edit_stock_audit AS
SELECT 
    sm.id,
    sm.product_id,
    p.name as product_name,
    sm.movement_type,
    sm.quantity,
    sm.stock_after,
    sm.reference_id as transaction_id,
    sm.reason,
    sm.created_at,
    s.total_amount as transaction_total,
    u.first_name || ' ' || u.last_name as edited_by_name
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
LEFT JOIN sales s ON sm.reference_id = s.id
LEFT JOIN users u ON s.user_id = u.id
WHERE sm.reference_type = 'sale_edit'
ORDER BY sm.created_at DESC;

-- =================================================
-- ✅ DEPLOYMENT COMPLETE!
-- =================================================

SELECT 'Stock management functions deployed successfully!' as status;
