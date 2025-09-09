-- =====================================================
-- PROFESSIONAL COMPLETE PAYMENT DIAGNOSTIC TEST
-- =====================================================
-- Tests complete payment workflow for double deduction and revenue issues
-- =====================================================

DO $$
DECLARE
    test_product_id UUID;
    initial_stock INTEGER;
    after_complete_stock INTEGER;
    test_transaction_id UUID;
    test_result JSONB;
    rec RECORD;
    initial_sales_count INTEGER;
    after_complete_sales_count INTEGER;
    total_revenue_before NUMERIC;
    total_revenue_after NUMERIC;
    completed_transactions_before INTEGER;
    completed_transactions_after INTEGER;
BEGIN
    RAISE NOTICE '🔍 PROFESSIONAL COMPLETE PAYMENT DIAGNOSTIC STARTING...';
    RAISE NOTICE '================================================';
    
    -- Get a product for testing
    SELECT id, stock_in_pieces INTO test_product_id, initial_stock 
    FROM products 
    WHERE stock_in_pieces > 100 
    LIMIT 1;
    
    IF test_product_id IS NULL THEN
        RAISE NOTICE '❌ No product with sufficient stock found for testing';
        RETURN;
    END IF;
    
    -- Get baseline metrics
    SELECT COUNT(*) INTO initial_sales_count FROM sales WHERE status = 'completed';
    SELECT COALESCE(SUM(total_amount), 0) INTO total_revenue_before FROM sales WHERE status = 'completed';
    SELECT COUNT(*) INTO completed_transactions_before FROM sales WHERE status = 'completed';
    
    RAISE NOTICE '📊 BASELINE METRICS:';
    RAISE NOTICE '  Product: % (Stock: %)', test_product_id, initial_stock;
    RAISE NOTICE '  Completed Sales: %', initial_sales_count;
    RAISE NOTICE '  Total Revenue: %', total_revenue_before;
    RAISE NOTICE '';
    
    -- STEP 1: Create a pending sale (50 pieces)
    RAISE NOTICE '🆕 STEP 1: Creating pending transaction...';
    SELECT create_sale_with_items(
        jsonb_build_object(
            'user_id', (SELECT id FROM users LIMIT 1),
            'total_amount', 1000.00,
            'payment_method', 'cash',
            'customer_name', null,
            'customer_phone', null,
            'notes', 'Complete payment diagnostic test',
            'discount_type', 'none',
            'discount_percentage', 0,
            'discount_amount', 0,
            'subtotal_before_discount', 1000.00,
            'pwd_senior_id', null
        ),
        ARRAY[
            jsonb_build_object(
                'product_id', test_product_id,
                'quantity', 50, -- 50 pieces
                'unit_type', 'piece',
                'unit_price', 20.00,
                'total_price', 1000.00
            )
        ]
    ) INTO test_result;
    
    test_transaction_id := (test_result->>'id')::UUID;
    RAISE NOTICE '✅ Pending transaction created: %', test_transaction_id;
    
    -- Check stock after pending (should be unchanged)
    SELECT stock_in_pieces INTO after_complete_stock FROM products WHERE id = test_product_id;
    RAISE NOTICE '📦 Stock after pending: % (Expected: % - no change)', after_complete_stock, initial_stock;
    
    -- STEP 2: Complete the payment (THIS IS WHERE THE ISSUE MIGHT BE)
    RAISE NOTICE '';
    RAISE NOTICE '💰 STEP 2: Completing payment (CRITICAL TEST)...';
    
    -- Record stock movements before completion
    RAISE NOTICE '📋 Stock movements BEFORE completion:';
    FOR rec IN 
        SELECT movement_type, stock_before, stock_after, quantity, created_at, reason
        FROM stock_movements 
        WHERE product_id = test_product_id 
        AND created_at > NOW() - INTERVAL '2 minutes'
        ORDER BY created_at DESC
        LIMIT 5
    LOOP
        RAISE NOTICE '  % | Before: % | After: % | Qty: % | %', 
                     rec.movement_type, rec.stock_before, rec.stock_after, 
                     rec.quantity, rec.reason;
    END LOOP;
    
    -- COMPLETE THE PAYMENT
    SELECT complete_transaction_with_stock(test_transaction_id) INTO test_result;
    RAISE NOTICE '✅ Complete payment result: %', test_result;
    
    -- Check stock after completion (CRITICAL CHECK)
    SELECT stock_in_pieces INTO after_complete_stock FROM products WHERE id = test_product_id;
    RAISE NOTICE '📦 Stock after completion: % (Expected: %)', after_complete_stock, initial_stock - 50;
    
    -- Check if stock was deducted correctly (not doubled)
    IF after_complete_stock = initial_stock - 50 THEN
        RAISE NOTICE '✅ STOCK DEDUCTION: CORRECT (single deduction of 50)';
    ELSIF after_complete_stock = initial_stock - 100 THEN
        RAISE NOTICE '❌ STOCK DEDUCTION: DOUBLED! (deducted 100 instead of 50)';
    ELSE
        RAISE NOTICE '❌ STOCK DEDUCTION: UNEXPECTED! (deducted % instead of 50)', initial_stock - after_complete_stock;
    END IF;
    
    -- Record stock movements after completion
    RAISE NOTICE '';
    RAISE NOTICE '📋 Stock movements AFTER completion:';
    FOR rec IN 
        SELECT movement_type, stock_before, stock_after, quantity, created_at, reason
        FROM stock_movements 
        WHERE product_id = test_product_id 
        AND created_at > NOW() - INTERVAL '2 minutes'
        ORDER BY created_at DESC
        LIMIT 10
    LOOP
        RAISE NOTICE '  % | Before: % | After: % | Qty: % | %', 
                     rec.movement_type, rec.stock_before, rec.stock_after, 
                     rec.quantity, rec.reason;
    END LOOP;
    
    -- Check revenue metrics
    RAISE NOTICE '';
    RAISE NOTICE '💵 STEP 3: Checking revenue tracking...';
    SELECT COUNT(*) INTO after_complete_sales_count FROM sales WHERE status = 'completed';
    SELECT COALESCE(SUM(total_amount), 0) INTO total_revenue_after FROM sales WHERE status = 'completed';
    SELECT COUNT(*) INTO completed_transactions_after FROM sales WHERE status = 'completed';
    
    RAISE NOTICE '📊 REVENUE METRICS AFTER COMPLETION:';
    RAISE NOTICE '  Completed Sales: % (was: %)', after_complete_sales_count, initial_sales_count;
    RAISE NOTICE '  Total Revenue: % (was: %)', total_revenue_after, total_revenue_before;
    RAISE NOTICE '  Revenue Change: %', total_revenue_after - total_revenue_before;
    
    -- Verify revenue tracking
    IF (total_revenue_after - total_revenue_before) = 1000.00 THEN
        RAISE NOTICE '✅ REVENUE TRACKING: CORRECT (added 1000.00)';
    ELSE
        RAISE NOTICE '❌ REVENUE TRACKING: INCORRECT (expected +1000.00, got +%)', total_revenue_after - total_revenue_before;
    END IF;
    
    -- Check transaction status
    RAISE NOTICE '';
    RAISE NOTICE '📄 Transaction status check:';
    FOR rec IN 
        SELECT id, status, total_amount, created_at, updated_at
        FROM sales 
        WHERE id = test_transaction_id
    LOOP
        RAISE NOTICE '  ID: % | Status: % | Amount: % | Created: % | Updated: %', 
                     rec.id, rec.status, rec.total_amount, rec.created_at, rec.updated_at;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DIAGNOSTIC SUMMARY:';
    RAISE NOTICE '================================================';
    
    IF after_complete_stock = initial_stock - 50 AND (total_revenue_after - total_revenue_before) = 1000.00 THEN
        RAISE NOTICE '✅ ALL SYSTEMS WORKING CORRECTLY';
        RAISE NOTICE '  - Stock deducted correctly (single deduction)';
        RAISE NOTICE '  - Revenue tracked correctly';
    ELSE
        RAISE NOTICE '❌ ISSUES DETECTED:';
        IF after_complete_stock != initial_stock - 50 THEN
            RAISE NOTICE '  - Stock deduction problem (expected -%, got -%)', 50, initial_stock - after_complete_stock;
        END IF;
        IF (total_revenue_after - total_revenue_before) != 1000.00 THEN
            RAISE NOTICE '  - Revenue tracking problem (expected +1000.00, got +%)', total_revenue_after - total_revenue_before;
        END IF;
    END IF;
    
    -- Clean up: Undo the transaction for testing
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Cleaning up test transaction...';
    SELECT undo_transaction_completely(test_transaction_id) INTO test_result;
    RAISE NOTICE '✅ Test cleanup completed';
    
END $$;

-- Additional check: Look for duplicate function calls
SELECT 'CHECKING FOR MULTIPLE COMPLETE FUNCTIONS' as status;
SELECT 
    routine_name, 
    routine_type,
    created
FROM information_schema.routines 
WHERE routine_name LIKE '%complete%transaction%' 
AND routine_schema = 'public'
ORDER BY routine_name;
