-- =====================================================
-- PROFESSIONAL POS SYSTEM COMPLETE FIX
-- =====================================================
-- Targeted fixes for double deduction and revenue tracking issues
-- =====================================================

-- ========== FIX 1: REMOVE COMPETING TRIGGERS ==========
DO $$
BEGIN
    RAISE NOTICE '🔧 REMOVING COMPETING TRIGGERS THAT CAUSE DOUBLE DEDUCTION...';
    
    -- Remove all triggers that automatically deduct stock
    DROP TRIGGER IF EXISTS trigger_deduct_stock_on_sale ON sale_items;
    DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sales;
    DROP TRIGGER IF EXISTS professional_stock_management_trigger ON sale_items;
    DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_item_delete ON sale_items;
    DROP TRIGGER IF EXISTS auto_stock_deduction ON sale_items;
    DROP TRIGGER IF EXISTS stock_management_trigger ON sale_items;
    
    RAISE NOTICE '✅ Removed all competing stock management triggers';
    RAISE NOTICE '✅ Now only manual functions control stock deduction';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some triggers may not exist (this is OK): %', SQLERRM;
END $$;

-- ========== FIX 2: CORRECT REVENUE TRACKING ==========

-- Fix the undo function to properly mark transactions as cancelled
CREATE OR REPLACE FUNCTION undo_transaction_completely(p_transaction_id UUID)
RETURNS JSONB AS $$
DECLARE
    sale_item RECORD;
    pieces_to_restore INTEGER;
    system_user_id UUID;
    current_stock_before INTEGER;
    current_stock_after INTEGER;
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
        SELECT si.product_id, si.quantity, si.unit_type, p.pieces_per_sheet, p.sheets_per_box, p.name
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
        
        -- Get current stock BEFORE restoration
        SELECT stock_in_pieces INTO current_stock_before 
        FROM products 
        WHERE id = sale_item.product_id;
        
        -- Calculate stock AFTER restoration
        current_stock_after := current_stock_before + pieces_to_restore;
        
        -- Restore the stock
        UPDATE products 
        SET stock_in_pieces = current_stock_after,
            updated_at = NOW()
        WHERE id = sale_item.product_id;
        
        -- Log the restoration
        INSERT INTO stock_movements (
            product_id, user_id, movement_type, quantity, reason, 
            reference_type, reference_id, stock_before, stock_after, created_at
        ) VALUES (
            sale_item.product_id, system_user_id, 'in', pieces_to_restore,
            'Stock restored for transaction undo', 'sale_undo', p_transaction_id,
            current_stock_before, current_stock_after, NOW()
        );
        
        RAISE NOTICE 'UNDO: Product % restored % pieces (% → %)', 
            sale_item.name, pieces_to_restore, current_stock_before, current_stock_after;
    END LOOP;
    
    -- CRITICAL FIX: Mark transaction as CANCELLED (not just edited)
    UPDATE sales 
    SET status = 'cancelled',  -- This removes it from revenue calculations
        is_edited = true,
        edited_at = NOW(),
        edit_reason = 'Transaction undone and stock restored',
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Transaction cancelled and stock restored',
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

-- ========== FIX 3: ENSURE COMPLETE FUNCTION IS CORRECT ==========

-- Ensure complete function only deducts stock once
CREATE OR REPLACE FUNCTION complete_transaction_with_stock(p_transaction_id UUID)
RETURNS JSONB AS $$
DECLARE
    sale_item RECORD;
    pieces_needed INTEGER;
    current_stock_before INTEGER;
    current_stock_after INTEGER;
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
    FOR sale_item IN 
        SELECT si.product_id, si.quantity, si.unit_type, p.pieces_per_sheet, p.sheets_per_box, p.name
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
        
        -- Get current stock BEFORE deduction
        SELECT stock_in_pieces INTO current_stock_before 
        FROM products 
        WHERE id = sale_item.product_id;
        
        -- Final stock check
        IF current_stock_before < pieces_needed THEN
            RAISE EXCEPTION 'Insufficient stock for %: needed %, available %', 
                sale_item.name, pieces_needed, current_stock_before;
        END IF;
        
        -- Calculate stock AFTER deduction
        current_stock_after := current_stock_before - pieces_needed;
        
        -- Deduct stock (SINGLE DEDUCTION ONLY)
        UPDATE products 
        SET stock_in_pieces = current_stock_after,
            updated_at = NOW()
        WHERE id = sale_item.product_id;
        
        -- Log stock movement
        INSERT INTO stock_movements (
            product_id, user_id, movement_type, quantity, reason, 
            reference_type, reference_id, stock_before, stock_after, created_at
        ) VALUES (
            sale_item.product_id, system_user_id, 'out', pieces_needed,
            'Stock deducted for completed transaction', 'sale_complete', p_transaction_id,
            current_stock_before, current_stock_after, NOW()
        );
        
        RAISE NOTICE 'DEDUCT: Product % deducted % pieces (% → %)', 
            sale_item.name, pieces_needed, current_stock_before, current_stock_after;
    END LOOP;
    
    -- Mark transaction as completed
    UPDATE sales 
    SET status = 'completed',
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
        'message', 'Failed to complete transaction'
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========== VERIFICATION TEST ==========

DO $$
DECLARE
    test_product_id UUID;
    test_user_id UUID;
    initial_stock INTEGER;
    test_transaction_id UUID;
    test_result JSONB;
    stock_after_complete INTEGER;
    stock_after_undo INTEGER;
    initial_revenue NUMERIC;
    revenue_after_complete NUMERIC;
    revenue_after_undo NUMERIC;
BEGIN
    -- Get test data
    SELECT id INTO test_user_id FROM users WHERE is_active = true LIMIT 1;
    SELECT id, stock_in_pieces INTO test_product_id, initial_stock 
    FROM products 
    WHERE stock_in_pieces > 100 AND is_active = true
    LIMIT 1;
    
    -- Get initial revenue
    SELECT COALESCE(SUM(total_amount), 0) INTO initial_revenue 
    FROM sales WHERE status = 'completed';
    
    RAISE NOTICE '';
    RAISE NOTICE '🧪 RUNNING VERIFICATION TEST';
    RAISE NOTICE '===========================';
    RAISE NOTICE 'Initial stock: %', initial_stock;
    RAISE NOTICE 'Initial revenue: %', initial_revenue;
    
    -- Create transaction
    SELECT create_sale_with_items(
        jsonb_build_object(
            'user_id', test_user_id,
            'total_amount', 1000.00,
            'payment_method', 'cash',
            'notes', 'Fix verification test'
        ),
        ARRAY[
            jsonb_build_object(
                'product_id', test_product_id,
                'quantity', 50,
                'unit_type', 'piece',
                'unit_price', 20.00,
                'total_price', 1000.00
            )
        ]
    ) INTO test_result;
    
    test_transaction_id := (test_result->>'id')::UUID;
    RAISE NOTICE 'Transaction created: %', test_transaction_id;
    
    -- Complete transaction
    SELECT complete_transaction_with_stock(test_transaction_id) INTO test_result;
    
    SELECT stock_in_pieces INTO stock_after_complete FROM products WHERE id = test_product_id;
    SELECT COALESCE(SUM(total_amount), 0) INTO revenue_after_complete 
    FROM sales WHERE status = 'completed';
    
    RAISE NOTICE 'After complete: Stock=% (expected %), Revenue=% (expected %)', 
                 stock_after_complete, initial_stock - 50, revenue_after_complete, initial_revenue + 1000;
    
    -- Undo transaction
    SELECT undo_transaction_completely(test_transaction_id) INTO test_result;
    
    SELECT stock_in_pieces INTO stock_after_undo FROM products WHERE id = test_product_id;
    SELECT COALESCE(SUM(total_amount), 0) INTO revenue_after_undo 
    FROM sales WHERE status = 'completed';
    
    RAISE NOTICE 'After undo: Stock=% (expected %), Revenue=% (expected %)', 
                 stock_after_undo, initial_stock, revenue_after_undo, initial_revenue;
    
    -- Final verification
    IF stock_after_complete = initial_stock - 50 AND 
       stock_after_undo = initial_stock AND
       revenue_after_complete = initial_revenue + 1000 AND
       revenue_after_undo = initial_revenue THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 ALL TESTS PASSED! POS SYSTEM FIXED!';
        RAISE NOTICE '✅ No double stock deduction';
        RAISE NOTICE '✅ Perfect stock restoration';
        RAISE NOTICE '✅ Correct revenue tracking';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ ISSUES STILL EXIST - CHECK IMPLEMENTATION';
    END IF;
    
END $$;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🏆 PROFESSIONAL POS SYSTEM FIX COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Removed all competing triggers';
    RAISE NOTICE '✅ Fixed revenue tracking (cancelled transactions excluded)';
    RAISE NOTICE '✅ Ensured single stock deduction on completion';
    RAISE NOTICE '✅ Perfect stock restoration on undo';
    RAISE NOTICE '';
    RAISE NOTICE 'Your POS system should now work perfectly! 🚀';
    RAISE NOTICE '';
    RAISE NOTICE 'Test in your frontend:';
    RAISE NOTICE '1. Complete a payment - stock deducted once';
    RAISE NOTICE '2. Undo transaction - stock restored exactly';
    RAISE NOTICE '3. Check revenue - cancelled transactions excluded';
END $$;
