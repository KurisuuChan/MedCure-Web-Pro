-- Fix inventory update trigger for POS transactions
-- This script fixes the stock update issue when completing sales

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sale_items;
DROP FUNCTION IF EXISTS update_stock_on_sale();

-- 2. Create improved stock update function with better error handling
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
    pieces_to_deduct INTEGER;
    product_pieces_per_sheet INTEGER;
    product_sheets_per_box INTEGER;
BEGIN
    -- Log the trigger execution
    RAISE NOTICE 'Stock update trigger fired for product_id: %, quantity: %, unit_type: %', 
                 NEW.product_id, NEW.quantity, NEW.unit_type;
    
    -- Get current stock and product configuration
    SELECT stock_in_pieces, pieces_per_sheet, sheets_per_box 
    INTO current_stock, product_pieces_per_sheet, product_sheets_per_box
    FROM products 
    WHERE id = NEW.product_id;
    
    -- Check if product exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', NEW.product_id;
    END IF;
    
    -- Calculate pieces to deduct based on unit type
    CASE COALESCE(NEW.unit_type, 'piece')
        WHEN 'piece' THEN
            pieces_to_deduct := NEW.quantity;
        WHEN 'sheet' THEN
            pieces_to_deduct := NEW.quantity * COALESCE(product_pieces_per_sheet, 1);
        WHEN 'box' THEN
            pieces_to_deduct := NEW.quantity * COALESCE(product_pieces_per_sheet, 1) * COALESCE(product_sheets_per_box, 1);
        ELSE
            -- Default to piece if unit_type is unknown
            pieces_to_deduct := NEW.quantity;
    END CASE;
    
    RAISE NOTICE 'Deducting % pieces from current stock of %', pieces_to_deduct, current_stock;
    
    -- Check if sufficient stock
    IF current_stock < pieces_to_deduct THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Required: %', current_stock, pieces_to_deduct;
    END IF;
    
    -- Update product stock
    UPDATE products 
    SET stock_in_pieces = stock_in_pieces - pieces_to_deduct,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Verify the update
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to update stock for product ID %', NEW.product_id;
    END IF;
    
    -- Record stock movement
    INSERT INTO stock_movements (
        product_id, 
        user_id, 
        movement_type, 
        quantity, 
        reason,
        reference_id, 
        reference_type, 
        stock_before, 
        stock_after,
        created_at
    ) VALUES (
        NEW.product_id,
        (SELECT user_id FROM sales WHERE id = NEW.sale_id),
        'out',
        -pieces_to_deduct,
        'Sale transaction - ' || COALESCE(NEW.unit_type, 'piece'),
        NEW.sale_id,
        'sale',
        current_stock,
        current_stock - pieces_to_deduct,
        NOW()
    );
    
    RAISE NOTICE 'Stock updated successfully. New stock: %', current_stock - pieces_to_deduct;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in stock update trigger: %', SQLERRM;
        -- Re-raise the exception to rollback the transaction
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger
CREATE TRIGGER trigger_update_stock_on_sale
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_on_sale();

-- 4. Enable logging for debugging (optional - can be disabled in production)
-- This will help us see what's happening in the database logs
SET log_min_messages = NOTICE;

-- 5. Test the trigger with a simple query (comment out after testing)
-- You can run this to verify the trigger is working:
/*
-- Test query to check if trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_stock_on_sale';
*/

COMMIT;
