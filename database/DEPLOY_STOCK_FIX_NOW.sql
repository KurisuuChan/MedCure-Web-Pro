-- =================================================
-- 🚨 CRITICAL FIX: STOCK MANAGEMENT LOGIC ERROR
-- This fixes the double deduction and inconsistent stock handling
-- =================================================

-- =================================================
-- 1. FIRST: CREATE PROPER STOCK DEDUCTION TRIGGER
-- =================================================

CREATE OR REPLACE FUNCTION deduct_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
    pieces_to_deduct INTEGER;
    product_pieces_per_sheet INTEGER;
    product_sheets_per_box INTEGER;
    product_name TEXT;
BEGIN
    -- Get current stock and product configuration
    SELECT stock_in_pieces, pieces_per_sheet, sheets_per_box, name
    INTO current_stock, product_pieces_per_sheet, product_sheets_per_box, product_name
    FROM products 
    WHERE id = NEW.product_id;
    
    -- Calculate pieces to deduct based on unit type
    CASE COALESCE(NEW.unit_type, 'piece')
        WHEN 'piece' THEN
            pieces_to_deduct := NEW.quantity;
        WHEN 'sheet' THEN
            pieces_to_deduct := NEW.quantity * COALESCE(product_pieces_per_sheet, 1);
        WHEN 'box' THEN
            pieces_to_deduct := NEW.quantity * COALESCE(product_pieces_per_sheet, 1) * COALESCE(product_sheets_per_box, 1);
        ELSE
            pieces_to_deduct := NEW.quantity;
    END CASE;
    
    -- Check stock availability
    IF current_stock < pieces_to_deduct THEN
        RAISE EXCEPTION 'Insufficient stock for product %: needed %, available %', 
            product_name, pieces_to_deduct, current_stock;
    END IF;
    
    -- Update product stock
    UPDATE products 
    SET stock_in_pieces = current_stock - pieces_to_deduct
    WHERE id = NEW.product_id;
    
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
        NEW.product_id,
        (SELECT user_id FROM sales WHERE id = NEW.sale_id),
        'out',
        pieces_to_deduct,
        'Stock deducted for sale',
        'sale',
        NEW.sale_id,
        current_stock,
        current_stock - pieces_to_deduct
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stock deduction on sale_items INSERT
DROP TRIGGER IF EXISTS trigger_deduct_stock_on_sale ON sale_items;
CREATE TRIGGER trigger_deduct_stock_on_sale
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION deduct_stock_on_sale();

-- =================================================
-- 2. FIX STOCK RESTORATION TRIGGER (Already exists but ensure it's correct)
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

-- Ensure the restoration trigger exists
DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_item_delete ON sale_items;
CREATE TRIGGER trigger_restore_stock_on_sale_item_delete
    BEFORE DELETE ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION restore_stock_on_edit();

-- =================================================
-- 3. FIX TRANSACTION EDITING FUNCTION (Remove manual stock handling)
-- =================================================

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
    items_count INTEGER;
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
            pwd_senior_id = CASE 
                WHEN p_edit_data->>'pwd_senior_id' = 'null' OR p_edit_data->>'pwd_senior_id' = '' 
                THEN NULL 
                ELSE (p_edit_data->>'pwd_senior_id')::UUID 
            END,
            is_edited = true,
            edited_at = NOW(),
            edited_by = (p_edit_data->>'edited_by')::UUID,
            edit_reason = p_edit_data->>'edit_reason'
        WHERE id = p_transaction_id;
        
        -- 2. Delete old sale items (this will trigger stock restoration automatically)
        DELETE FROM sale_items WHERE sale_id = p_transaction_id;
        
        -- 3. Check if we have items to process
        items_count := jsonb_array_length(p_new_items);
        
        -- Only process items if array is not empty
        IF items_count > 0 THEN
            -- 4. Insert new items (triggers will handle stock deduction automatically)
            FOR item IN SELECT * FROM jsonb_array_elements(p_new_items)
            LOOP
                -- Insert new sale item (trigger will handle stock deduction)
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
                
                -- Note: Stock deduction is handled automatically by trigger
                -- No manual stock manipulation needed!
            END LOOP;
        ELSE
            RAISE NOTICE 'No items to process in transaction edit';
        END IF;
        
        -- Return success
        RETURN QUERY SELECT true, 'Transaction edited successfully'::TEXT, p_transaction_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error details
            RAISE NOTICE 'Error in edit_transaction_with_stock_management: %', SQLERRM;
            -- Rollback and return error
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- 4. DISABLE MANUAL STOCK DEDUCTION IN PROCESS_SALE
-- =================================================

-- Update the process_sale function to NOT manually deduct stock
-- Let the triggers handle everything consistently

CREATE OR REPLACE FUNCTION process_sale(
    p_sale_data JSONB,
    p_sale_items JSONB[]
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    sale_id UUID
) AS $$
DECLARE
    new_sale_id UUID;
    item JSONB;
    current_stock INTEGER;
    pieces_needed INTEGER;
    product_pieces_per_sheet INTEGER;
    product_sheets_per_box INTEGER;
    product_name TEXT;
BEGIN
    -- Generate new sale ID
    new_sale_id := gen_random_uuid();
    
    BEGIN
        -- 1. First, validate all items have sufficient stock
        FOR item IN SELECT unnest(p_sale_items)
        LOOP
            -- Get current stock and product configuration
            SELECT stock_in_pieces, pieces_per_sheet, sheets_per_box, name
            INTO current_stock, product_pieces_per_sheet, product_sheets_per_box, product_name
            FROM products 
            WHERE id = (item->>'product_id')::UUID;
            
            -- Calculate pieces needed based on unit type
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
        END LOOP;
        
        -- 2. Create the sale record
        INSERT INTO sales (
            id,
            user_id,
            total_amount,
            subtotal_before_discount,
            discount_type,
            discount_percentage,
            discount_amount,
            payment_method,
            customer_name,
            customer_phone,
            pwd_senior_id,
            notes,
            status
        ) VALUES (
            new_sale_id,
            (p_sale_data->>'user_id')::UUID,
            (p_sale_data->>'total_amount')::DECIMAL,
            COALESCE((p_sale_data->>'subtotal_before_discount')::DECIMAL, (p_sale_data->>'total_amount')::DECIMAL),
            COALESCE(p_sale_data->>'discount_type', 'none'),
            COALESCE((p_sale_data->>'discount_percentage')::DECIMAL, 0),
            COALESCE((p_sale_data->>'discount_amount')::DECIMAL, 0),
            p_sale_data->>'payment_method',
            p_sale_data->>'customer_name',
            p_sale_data->>'customer_phone',
            CASE 
                WHEN p_sale_data->>'pwd_senior_id' = 'null' OR p_sale_data->>'pwd_senior_id' = '' 
                THEN NULL 
                ELSE (p_sale_data->>'pwd_senior_id')::UUID 
            END,
            p_sale_data->>'notes',
            'completed'
        );
        
        -- 3. Insert sale items (triggers will handle stock deduction automatically)
        FOR item IN SELECT unnest(p_sale_items)
        LOOP
            INSERT INTO sale_items (
                sale_id,
                product_id,
                quantity,
                unit_type,
                unit_price,
                total_price
            ) VALUES (
                new_sale_id,
                (item->>'product_id')::UUID,
                (item->>'quantity')::INTEGER,
                COALESCE(item->>'unit_type', 'piece'),
                (item->>'unit_price')::DECIMAL,
                (item->>'total_price')::DECIMAL
            );
            
            -- NOTE: Stock is now handled automatically by the trigger!
            -- No manual stock deduction needed
        END LOOP;
        
        -- Return success
        RETURN QUERY SELECT true, 'Sale processed successfully'::TEXT, new_sale_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error details
            RAISE NOTICE 'Error in process_sale: %', SQLERRM;
            -- Rollback and return error
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- ✅ STOCK LOGIC FIX COMPLETE!
-- =================================================

SELECT 'Stock management logic fixed - now using consistent trigger-based approach!' as status;
