-- =====================================================
-- PROFESSIONAL COMPLETE SYSTEM FIX TEST
-- =====================================================
-- Tests both stock deduction and revenue tracking fixes
-- =====================================================

DO $$
DECLARE
    test_product_id UUID;
    initial_stock INTEGER;
    after_complete_stock INTEGER;
    after_undo_stock INTEGER;
    test_transaction_id UUID;
    test_result JSONB;
    initial_revenue NUMERIC;
    after_complete_revenue NUMERIC;
    after_undo_revenue NUMERIC;
    initial_completed_count INTEGER;
    after_complete_count INTEGER;
    after_undo_count INTEGER;
    initial_cancelled_count INTEGER;
    after_undo_cancelled_count INTEGER;
BEGIN
    RAISE NOTICE '🎯 PROFESSIONAL COMPLETE SYSTEM FIX TEST';
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'Testing: Stock deduction + Revenue tracking';
    RAISE NOTICE '';
    
    -- Get test product
    SELECT id, stock_in_pieces INTO test_product_id, initial_stock 
    FROM products 
    WHERE stock_in_pieces > 100 
    LIMIT 1;
    
    -- Get baseline metrics
    SELECT COALESCE(SUM(total_amount), 0) INTO initial_revenue 
    FROM sales WHERE status = 'completed';
    
    SELECT COUNT(*) INTO initial_completed_count 
    FROM sales WHERE status = 'completed';
    
    SELECT COUNT(*) INTO initial_cancelled_count 
    FROM sales WHERE status = 'cancelled';
    
    RAISE NOTICE '📊 BASELINE METRICS:';
    RAISE NOTICE '  Product Stock: %', initial_stock;
    RAISE NOTICE '  Total Revenue: %', initial_revenue;
    RAISE NOTICE '  Completed Sales: %', initial_completed_count;
    RAISE NOTICE '  Cancelled Sales: %', initial_cancelled_count;
    RAISE NOTICE '';
    
    -- STEP 1: Create pending transaction
    RAISE NOTICE '🆕 STEP 1: Creating pending transaction (50 pieces)...';
    SELECT create_sale_with_items(
        jsonb_build_object(
            'user_id', (SELECT id FROM users LIMIT 1),
            'total_amount', 1000.00,
            'payment_method', 'cash',
            'customer_name', null,
            'customer_phone', null,
            'notes', 'Complete system fix test',
            'discount_type', 'none',
            'discount_percentage', 0,
            'discount_amount', 0,
            'subtotal_before_discount', 1000.00,
            'pwd_senior_id', null
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
    RAISE NOTICE '✅ Pending transaction: %', test_transaction_id;
    
    -- STEP 2: Complete the payment
    RAISE NOTICE '';
    RAISE NOTICE '💰 STEP 2: Completing payment...';
    SELECT complete_transaction_with_stock(test_transaction_id) INTO test_result;
    
    -- Check stock after completion
    SELECT stock_in_pieces INTO after_complete_stock FROM products WHERE id = test_product_id;
    
    -- Check revenue after completion  
    SELECT COALESCE(SUM(total_amount), 0) INTO after_complete_revenue 
    FROM sales WHERE status = 'completed';
    
    SELECT COUNT(*) INTO after_complete_count 
    FROM sales WHERE status = 'completed';
    
    RAISE NOTICE '📦 Stock after completion: % (Expected: %)', after_complete_stock, initial_stock - 50;
    RAISE NOTICE '💵 Revenue after completion: % (Expected: %)', after_complete_revenue, initial_revenue + 1000;
    RAISE NOTICE '📊 Completed sales: % (Expected: %)', after_complete_count, initial_completed_count + 1;
    
    -- Verify completion results
    IF after_complete_stock = initial_stock - 50 THEN
        RAISE NOTICE '✅ STOCK DEDUCTION: CORRECT (no double deduction)';
    ELSE
        RAISE NOTICE '❌ STOCK DEDUCTION: WRONG (deducted % instead of 50)', initial_stock - after_complete_stock;
    END IF;
    
    IF after_complete_revenue = initial_revenue + 1000 THEN
        RAISE NOTICE '✅ REVENUE TRACKING: CORRECT (added 1000.00)';
    ELSE
        RAISE NOTICE '❌ REVENUE TRACKING: WRONG (added % instead of 1000)', after_complete_revenue - initial_revenue;
    END IF;
    
    -- STEP 3: Undo the transaction
    RAISE NOTICE '';
    RAISE NOTICE '↩️  STEP 3: Undoing transaction...';
    SELECT undo_transaction_completely(test_transaction_id) INTO test_result;
    
    -- Check stock after undo
    SELECT stock_in_pieces INTO after_undo_stock FROM products WHERE id = test_product_id;
    
    -- Check revenue after undo
    SELECT COALESCE(SUM(total_amount), 0) INTO after_undo_revenue 
    FROM sales WHERE status = 'completed';
    
    SELECT COUNT(*) INTO after_complete_count 
    FROM sales WHERE status = 'completed';
    
    SELECT COUNT(*) INTO after_undo_cancelled_count 
    FROM sales WHERE status = 'cancelled';
    
    RAISE NOTICE '📦 Stock after undo: % (Expected: %)', after_undo_stock, initial_stock;
    RAISE NOTICE '💵 Revenue after undo: % (Expected: %)', after_undo_revenue, initial_revenue;
    RAISE NOTICE '📊 Completed sales: % (Expected: %)', after_complete_count, initial_completed_count;
    RAISE NOTICE '📊 Cancelled sales: % (Expected: %)', after_undo_cancelled_count, initial_cancelled_count + 1;
    
    -- Verify undo results
    IF after_undo_stock = initial_stock THEN
        RAISE NOTICE '✅ STOCK RESTORATION: PERFECT (exact restoration)';
    ELSE
        RAISE NOTICE '❌ STOCK RESTORATION: WRONG (difference: %)', initial_stock - after_undo_stock;
    END IF;
    
    IF after_undo_revenue = initial_revenue THEN
        RAISE NOTICE '✅ REVENUE RESTORATION: PERFECT (revenue properly excluded)';
    ELSE
        RAISE NOTICE '❌ REVENUE RESTORATION: WRONG (difference: %)', after_undo_revenue - initial_revenue;
    END IF;
    
    -- Final summary
    RAISE NOTICE '';
    RAISE NOTICE '🏆 FINAL SYSTEM TEST RESULTS:';
    RAISE NOTICE '============================================';
    
    IF after_complete_stock = initial_stock - 50 AND 
       after_complete_revenue = initial_revenue + 1000 AND
       after_undo_stock = initial_stock AND 
       after_undo_revenue = initial_revenue THEN
        RAISE NOTICE '🎉 ALL SYSTEMS PERFECT!';
        RAISE NOTICE '  ✅ No double stock deduction';
        RAISE NOTICE '  ✅ Correct revenue tracking on completion';
        RAISE NOTICE '  ✅ Perfect stock restoration on undo';
        RAISE NOTICE '  ✅ Correct revenue exclusion on undo';
        RAISE NOTICE '';
        RAISE NOTICE 'Your POS system is now working perfectly! 🚀';
    ELSE
        RAISE NOTICE '❌ ISSUES STILL EXIST:';
        IF after_complete_stock != initial_stock - 50 THEN
            RAISE NOTICE '  - Stock deduction issue on completion';
        END IF;
        IF after_complete_revenue != initial_revenue + 1000 THEN
            RAISE NOTICE '  - Revenue tracking issue on completion';
        END IF;
        IF after_undo_stock != initial_stock THEN
            RAISE NOTICE '  - Stock restoration issue on undo';
        END IF;
        IF after_undo_revenue != initial_revenue THEN
            RAISE NOTICE '  - Revenue restoration issue on undo';
        END IF;
    END IF;
    
END $$;
