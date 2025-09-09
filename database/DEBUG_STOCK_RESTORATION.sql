-- =================================================
-- 🚨 EMERGENCY STOCK RESTORATION DEBUG & FIX
-- This will diagnose and fix the stock restoration issue
-- =================================================

-- =================================================
-- 1. CHECK IF TRIGGERS EXIST AND ARE ACTIVE
-- =================================================

-- Check current triggers on sale_items table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'sale_items';

-- =================================================
-- 2. CREATE ENHANCED STOCK RESTORATION WITH LOGGING
-- =================================================

CREATE OR REPLACE FUNCTION restore_stock_on_edit()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
    pieces_to_restore INTEGER;
    product_pieces_per_sheet INTEGER;
    product_sheets_per_box INTEGER;
    product_name TEXT;
BEGIN
    -- Log that trigger is being executed
    RAISE NOTICE 'STOCK RESTORATION TRIGGER EXECUTING for product_id: %, quantity: %, unit_type: %', 
        OLD.product_id, OLD.quantity, OLD.unit_type;
    
    -- Get current stock and product configuration
    SELECT stock_in_pieces, pieces_per_sheet, sheets_per_box, name
    INTO current_stock, product_pieces_per_sheet, product_sheets_per_box, product_name
    FROM products 
    WHERE id = OLD.product_id;
    
    RAISE NOTICE 'Current stock before restoration: % for product: %', current_stock, product_name;
    
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
    
    RAISE NOTICE 'Pieces to restore: %', pieces_to_restore;
    
    -- Update product stock
    UPDATE products 
    SET stock_in_pieces = current_stock + pieces_to_restore
    WHERE id = OLD.product_id;
    
    RAISE NOTICE 'Stock after restoration: %', current_stock + pieces_to_restore;
    
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
    
    RAISE NOTICE 'Stock movement logged successfully';
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- 3. CREATE ENHANCED STOCK DEDUCTION WITH LOGGING
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
    -- Log that trigger is being executed
    RAISE NOTICE 'STOCK DEDUCTION TRIGGER EXECUTING for product_id: %, quantity: %, unit_type: %', 
        NEW.product_id, NEW.quantity, NEW.unit_type;
    
    -- Get current stock and product configuration
    SELECT stock_in_pieces, pieces_per_sheet, sheets_per_box, name
    INTO current_stock, product_pieces_per_sheet, product_sheets_per_box, product_name
    FROM products 
    WHERE id = NEW.product_id;
    
    RAISE NOTICE 'Current stock before deduction: % for product: %', current_stock, product_name;
    
    -- Calculate pieces to deduct based on unit type
    CASE COALESCE(NEW.unit_type, 'piece')
        WHEN 'piece' THEN
            pieces_to_deduct := NEW.quantity;
        WHEN 'sheet' THEN
            pieces_to_deduct := NEW.quantity * COALESCE(product_pieces_per_sheet, 1);
        WHEN 'box' THEN
            pieces_to_deduct := NEW.quantity * COALESCE(product_sheets_per_box, 1);
        ELSE
            pieces_to_deduct := NEW.quantity;
    END CASE;
    
    RAISE NOTICE 'Pieces to deduct: %', pieces_to_deduct;
    
    -- Check stock availability
    IF current_stock < pieces_to_deduct THEN
        RAISE EXCEPTION 'Insufficient stock for product %: needed %, available %', 
            product_name, pieces_to_deduct, current_stock;
    END IF;
    
    -- Update product stock
    UPDATE products 
    SET stock_in_pieces = current_stock - pieces_to_deduct
    WHERE id = NEW.product_id;
    
    RAISE NOTICE 'Stock after deduction: %', current_stock - pieces_to_deduct;
    
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
    
    RAISE NOTICE 'Stock movement logged successfully';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- 4. RECREATE TRIGGERS WITH PROPER ORDER
-- =================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_item_delete ON sale_items;
DROP TRIGGER IF EXISTS trigger_deduct_stock_on_sale ON sale_items;

-- Create restoration trigger (BEFORE DELETE)
CREATE TRIGGER trigger_restore_stock_on_sale_item_delete
    BEFORE DELETE ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION restore_stock_on_edit();

-- Create deduction trigger (AFTER INSERT)  
CREATE TRIGGER trigger_deduct_stock_on_sale
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION deduct_stock_on_sale();

-- =================================================
-- 5. TEST TRIGGER EXECUTION
-- =================================================

-- Create a test to verify triggers work
CREATE OR REPLACE FUNCTION test_stock_triggers()
RETURNS TEXT AS $$
DECLARE
    test_product_id UUID;
    test_sale_id UUID;
    initial_stock INTEGER;
    stock_after_insert INTEGER;
    stock_after_delete INTEGER;
    test_result TEXT;
BEGIN
    -- Get a test product
    SELECT id, stock_in_pieces INTO test_product_id, initial_stock
    FROM products 
    WHERE stock_in_pieces > 10 
    LIMIT 1;
    
    IF test_product_id IS NULL THEN
        RETURN 'No products available for testing';
    END IF;
    
    -- Create a test sale
    INSERT INTO sales (user_id, total_amount, payment_method, status)
    VALUES ('b9b31a83-66fd-46e5-b4be-3386c4988f48', 10.00, 'cash', 'completed')
    RETURNING id INTO test_sale_id;
    
    -- Insert a test sale item (should trigger deduction)
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_type, unit_price, total_price)
    VALUES (test_sale_id, test_product_id, 2, 'piece', 5.00, 10.00);
    
    -- Check stock after insert
    SELECT stock_in_pieces INTO stock_after_insert
    FROM products WHERE id = test_product_id;
    
    -- Delete the test sale item (should trigger restoration)
    DELETE FROM sale_items WHERE sale_id = test_sale_id;
    
    -- Check stock after delete
    SELECT stock_in_pieces INTO stock_after_delete
    FROM products WHERE id = test_product_id;
    
    -- Clean up test sale
    DELETE FROM sales WHERE id = test_sale_id;
    
    -- Generate test result
    test_result := format(
        'TRIGGER TEST RESULTS: Initial: %s, After Insert: %s, After Delete: %s. Expected: %s = %s',
        initial_stock, stock_after_insert, stock_after_delete, initial_stock, stock_after_delete
    );
    
    IF initial_stock = stock_after_delete AND stock_after_insert = (initial_stock - 2) THEN
        test_result := test_result || ' ✅ SUCCESS';
    ELSE
        test_result := test_result || ' ❌ FAILED';
    END IF;
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- 6. EMERGENCY STOCK CORRECTION FUNCTION
-- =================================================

CREATE OR REPLACE FUNCTION emergency_stock_correction()
RETURNS TEXT AS $$
DECLARE
    correction_count INTEGER := 0;
    product_record RECORD;
BEGIN
    -- This function can help restore lost stock by analyzing stock_movements
    
    FOR product_record IN 
        SELECT 
            p.id,
            p.name,
            p.stock_in_pieces as current_stock,
            COALESCE(
                SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE -sm.quantity END), 
                0
            ) as calculated_stock_change
        FROM products p
        LEFT JOIN stock_movements sm ON p.id = sm.product_id
        WHERE sm.created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY p.id, p.name, p.stock_in_pieces
        HAVING ABS(p.stock_in_pieces - COALESCE(SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE -sm.quantity END), 0)) > 0
    LOOP
        RAISE NOTICE 'Product % has stock discrepancy. Current: %, Expected change: %', 
            product_record.name, product_record.current_stock, product_record.calculated_stock_change;
        correction_count := correction_count + 1;
    END LOOP;
    
    RETURN format('Found %s products with potential stock discrepancies', correction_count);
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- ✅ ENHANCED DEBUGGING COMPLETE!
-- =================================================

-- Run the test
SELECT test_stock_triggers() as trigger_test_result;

-- Check for stock discrepancies
SELECT emergency_stock_correction() as stock_analysis;

SELECT 'Enhanced stock debugging deployed! Check trigger_test_result above.' as status;
