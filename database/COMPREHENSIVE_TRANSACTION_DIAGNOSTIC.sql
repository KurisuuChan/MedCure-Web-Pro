-- =====================================================
-- PROFESSIONAL TRANSACTION WORKFLOW DIAGNOSTIC
-- =====================================================
-- Comprehensive test of all transaction functions
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🚨 COMPREHENSIVE TRANSACTION WORKFLOW DIAGNOSTIC STARTING...';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'This diagnostic will test:';
    RAISE NOTICE '1. Function existence and compatibility';
    RAISE NOTICE '2. Complete payment workflow';
    RAISE NOTICE '3. Edit transaction functionality';
    RAISE NOTICE '4. Undo transaction functionality';
    RAISE NOTICE '5. Stock movement accuracy';
    RAISE NOTICE '6. Revenue tracking integrity';
    RAISE NOTICE '';
END $$;

-- ========== SECTION 1: FUNCTION EXISTENCE CHECK ==========
SELECT '🔍 SECTION 1: FUNCTION EXISTENCE CHECK' as diagnostic_section;

-- Check all required functions exist
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'create_sale_with_items' THEN '🟢 CORE CREATE'
        WHEN routine_name = 'complete_transaction_with_stock' THEN '🟢 CORE COMPLETE'
        WHEN routine_name = 'undo_transaction_completely' THEN '🟢 CORE UNDO'
        WHEN routine_name = 'edit_transaction_with_stock_management' THEN '🟡 EDIT FUNCTION'
        WHEN routine_name LIKE '%stock%' THEN '🔴 STOCK RELATED'
        WHEN routine_name LIKE '%transaction%' THEN '🟠 TRANSACTION RELATED'
        ELSE '⚪ OTHER'
    END as function_priority,
    EXISTS(
        SELECT 1 FROM information_schema.parameters 
        WHERE specific_name = r.specific_name
    ) as has_parameters
FROM information_schema.routines r
WHERE routine_schema = 'public'
AND (routine_name LIKE '%sale%' 
     OR routine_name LIKE '%transaction%' 
     OR routine_name LIKE '%stock%')
ORDER BY function_priority, routine_name;

-- ========== SECTION 2: CURRENT DATA STATE ANALYSIS ==========
SELECT '📊 SECTION 2: CURRENT DATA STATE ANALYSIS' as diagnostic_section;

-- Get test products
SELECT 'Available test products:' as info;
SELECT 
    id,
    name,
    stock_in_pieces,
    price_per_piece,
    is_active,
    status
FROM products 
WHERE stock_in_pieces > 50 
AND is_active = true
ORDER BY stock_in_pieces DESC
LIMIT 3;

-- Current sales statistics
SELECT 'Sales status distribution:' as info;
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as avg_amount
FROM sales 
GROUP BY status
ORDER BY count DESC;

-- Recent stock movements
SELECT 'Recent stock movements (last 5):' as info;
SELECT 
    sm.created_at,
    p.name as product_name,
    sm.movement_type,
    sm.quantity,
    sm.stock_before,
    sm.stock_after,
    sm.reason
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
ORDER BY sm.created_at DESC
LIMIT 5;

-- ========== SECTION 3: COMPREHENSIVE TRANSACTION WORKFLOW TEST ==========
SELECT '🧪 SECTION 3: COMPREHENSIVE TRANSACTION WORKFLOW TEST' as diagnostic_section;

DO $$
DECLARE
    test_product_id UUID;
    test_user_id UUID;
    initial_stock INTEGER;
    test_transaction_id UUID;
    edited_transaction_id UUID;
    test_result JSONB;
    
    -- Stock tracking variables
    stock_after_create INTEGER;
    stock_after_complete INTEGER;
    stock_after_edit INTEGER;
    stock_after_undo INTEGER;
    
    -- Revenue tracking variables
    initial_revenue NUMERIC;
    revenue_after_complete NUMERIC;
    revenue_after_edit NUMERIC;
    revenue_after_undo NUMERIC;
    
    -- Counter variables
    initial_completed_count INTEGER;
    initial_cancelled_count INTEGER;
    final_completed_count INTEGER;
    final_cancelled_count INTEGER;
    
    rec RECORD;
    function_exists BOOLEAN;
    test_passed BOOLEAN := true;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 STARTING COMPREHENSIVE WORKFLOW TEST';
    RAISE NOTICE '=====================================';
    
    -- Get test data
    SELECT id INTO test_user_id FROM users WHERE is_active = true LIMIT 1;
    SELECT id, stock_in_pieces INTO test_product_id, initial_stock 
    FROM products 
    WHERE stock_in_pieces > 100 AND is_active = true
    LIMIT 1;
    
    IF test_product_id IS NULL OR test_user_id IS NULL THEN
        RAISE NOTICE '❌ FAILED: No suitable test data found';
        RETURN;
    END IF;
    
    -- Get baseline metrics
    SELECT COALESCE(SUM(total_amount), 0) INTO initial_revenue 
    FROM sales WHERE status = 'completed';
    
    SELECT COUNT(*) INTO initial_completed_count 
    FROM sales WHERE status = 'completed';
    
    SELECT COUNT(*) INTO initial_cancelled_count 
    FROM sales WHERE status = 'cancelled';
    
    RAISE NOTICE 'Test Product: % (Stock: %)', test_product_id, initial_stock;
    RAISE NOTICE 'Test User: %', test_user_id;
    RAISE NOTICE 'Initial Revenue: %', initial_revenue;
    RAISE NOTICE 'Initial Completed Count: %', initial_completed_count;
    RAISE NOTICE '';
    
    -- TEST 1: CREATE TRANSACTION
    RAISE NOTICE '🆕 TEST 1: Creating transaction (30 pieces)...';
    BEGIN
        SELECT create_sale_with_items(
            jsonb_build_object(
                'user_id', test_user_id,
                'total_amount', 600.00,
                'payment_method', 'cash',
                'notes', 'Comprehensive workflow test',
                'discount_type', 'none',
                'discount_percentage', 0,
                'discount_amount', 0,
                'subtotal_before_discount', 600.00
            ),
            ARRAY[
                jsonb_build_object(
                    'product_id', test_product_id,
                    'quantity', 30,
                    'unit_type', 'piece',
                    'unit_price', 20.00,
                    'total_price', 600.00
                )
            ]
        ) INTO test_result;
        
        test_transaction_id := (test_result->>'id')::UUID;
        
        SELECT stock_in_pieces INTO stock_after_create FROM products WHERE id = test_product_id;
        
        RAISE NOTICE '✅ Transaction created: %', test_transaction_id;
        RAISE NOTICE 'Stock after create: % (Expected: % - no change)', stock_after_create, initial_stock;
        
        IF stock_after_create != initial_stock THEN
            RAISE NOTICE '❌ FAILED: Stock changed during create (should remain same)';
            test_passed := false;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: create_sale_with_items error: %', SQLERRM;
        test_passed := false;
        RETURN;
    END;
    
    -- TEST 2: COMPLETE TRANSACTION
    RAISE NOTICE '';
    RAISE NOTICE '💰 TEST 2: Completing transaction...';
    BEGIN
        SELECT complete_transaction_with_stock(test_transaction_id) INTO test_result;
        
        SELECT stock_in_pieces INTO stock_after_complete FROM products WHERE id = test_product_id;
        SELECT COALESCE(SUM(total_amount), 0) INTO revenue_after_complete 
        FROM sales WHERE status = 'completed';
        
        RAISE NOTICE '✅ Transaction completed successfully';
        RAISE NOTICE 'Stock after complete: % (Expected: %)', stock_after_complete, initial_stock - 30;
        RAISE NOTICE 'Revenue after complete: % (Expected: %)', revenue_after_complete, initial_revenue + 600;
        
        IF stock_after_complete != initial_stock - 30 THEN
            RAISE NOTICE '❌ FAILED: Incorrect stock deduction (got %, expected %)', 
                         initial_stock - stock_after_complete, 30;
            test_passed := false;
        END IF;
        
        IF revenue_after_complete != initial_revenue + 600 THEN
            RAISE NOTICE '❌ FAILED: Incorrect revenue tracking (got +%, expected +600)', 
                         revenue_after_complete - initial_revenue;
            test_passed := false;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: complete_transaction_with_stock error: %', SQLERRM;
        test_passed := false;
        RETURN;
    END;
    
    -- TEST 3: EDIT TRANSACTION (if function exists)
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'edit_transaction_with_stock_management'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE '✏️  TEST 3: Testing transaction edit...';
        BEGIN
            -- Create another transaction to edit
            SELECT create_sale_with_items(
                jsonb_build_object(
                    'user_id', test_user_id,
                    'total_amount', 400.00,
                    'payment_method', 'cash',
                    'notes', 'Edit test transaction'
                ),
                ARRAY[
                    jsonb_build_object(
                        'product_id', test_product_id,
                        'quantity', 20,
                        'unit_type', 'piece',
                        'unit_price', 20.00,
                        'total_price', 400.00
                    )
                ]
            ) INTO test_result;
            
            edited_transaction_id := (test_result->>'id')::UUID;
            
            -- Complete it
            SELECT complete_transaction_with_stock(edited_transaction_id) INTO test_result;
            
            -- Now edit it
            SELECT edit_transaction_with_stock_management(
                jsonb_build_object(
                    'transaction_id', edited_transaction_id,
                    'new_total', 500.00,
                    'edit_reason', 'Price adjustment test'
                )
            ) INTO test_result;
            
            SELECT stock_in_pieces INTO stock_after_edit FROM products WHERE id = test_product_id;
            
            RAISE NOTICE '✅ Transaction edit completed';
            RAISE NOTICE 'Stock after edit: %', stock_after_edit;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ FAILED: edit_transaction_with_stock_management error: %', SQLERRM;
            test_passed := false;
        END;
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  SKIPPED: edit_transaction_with_stock_management function not found';
    END IF;
    
    -- TEST 4: UNDO TRANSACTION
    RAISE NOTICE '';
    RAISE NOTICE '↩️  TEST 4: Testing transaction undo...';
    BEGIN
        SELECT undo_transaction_completely(test_transaction_id) INTO test_result;
        
        SELECT stock_in_pieces INTO stock_after_undo FROM products WHERE id = test_product_id;
        SELECT COALESCE(SUM(total_amount), 0) INTO revenue_after_undo 
        FROM sales WHERE status = 'completed';
        
        RAISE NOTICE '✅ Transaction undo completed';
        RAISE NOTICE 'Stock after undo: % (Expected: %)', stock_after_undo, initial_stock;
        RAISE NOTICE 'Revenue after undo: % (Expected: %)', revenue_after_undo, initial_revenue;
        
        IF stock_after_undo != initial_stock THEN
            RAISE NOTICE '❌ FAILED: Stock not restored correctly (difference: %)', 
                         initial_stock - stock_after_undo;
            test_passed := false;
        END IF;
        
        IF revenue_after_undo != initial_revenue THEN
            RAISE NOTICE '❌ FAILED: Revenue not restored correctly (difference: %)', 
                         revenue_after_undo - initial_revenue;
            test_passed := false;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: undo_transaction_completely error: %', SQLERRM;
        test_passed := false;
    END;
    
    -- Clean up edit test transaction if it exists
    IF edited_transaction_id IS NOT NULL THEN
        BEGIN
            SELECT undo_transaction_completely(edited_transaction_id) INTO test_result;
            RAISE NOTICE '🧹 Cleaned up edit test transaction';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️  Could not clean up edit test transaction: %', SQLERRM;
        END;
    END IF;
    
    -- FINAL RESULTS
    RAISE NOTICE '';
    RAISE NOTICE '🏆 COMPREHENSIVE TEST RESULTS';
    RAISE NOTICE '============================';
    
    IF test_passed THEN
        RAISE NOTICE '🎉 ALL TESTS PASSED! TRANSACTION SYSTEM WORKING CORRECTLY!';
        RAISE NOTICE '✅ Create transaction: WORKING';
        RAISE NOTICE '✅ Complete payment: WORKING';
        RAISE NOTICE '✅ Stock deduction: ACCURATE';
        RAISE NOTICE '✅ Revenue tracking: ACCURATE';
        RAISE NOTICE '✅ Undo transaction: WORKING';
        RAISE NOTICE '✅ Stock restoration: PERFECT';
    ELSE
        RAISE NOTICE '❌ TESTS FAILED! ISSUES DETECTED IN TRANSACTION SYSTEM!';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 RECOMMENDED ACTIONS:';
        RAISE NOTICE '1. Check function implementations';
        RAISE NOTICE '2. Verify database constraints';
        RAISE NOTICE '3. Test frontend integration';
        RAISE NOTICE '4. Apply professional fixes';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 DETAILED STOCK MOVEMENTS FOR THIS TEST:';
    FOR rec IN 
        SELECT 
            created_at,
            movement_type, 
            quantity, 
            stock_before, 
            stock_after, 
            reason
        FROM stock_movements 
        WHERE product_id = test_product_id 
        AND created_at > NOW() - INTERVAL '10 minutes'
        ORDER BY created_at ASC
    LOOP
        RAISE NOTICE '  % | % | Qty:% | %→% | %', 
                     rec.created_at, rec.movement_type, rec.quantity, 
                     rec.stock_before, rec.stock_after, rec.reason;
    END LOOP;
    
END $$;

-- ========== SECTION 4: SYSTEM HEALTH CHECK ==========
SELECT '🔧 SECTION 4: SYSTEM HEALTH CHECK' as diagnostic_section;

-- Check for orphaned transactions
SELECT 'Orphaned pending transactions:' as issue;
SELECT COUNT(*) as orphaned_pending_count
FROM sales 
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '1 hour';

-- Check for transactions without items
SELECT 'Transactions without sale items:' as issue;
SELECT COUNT(*) as transactions_without_items
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE si.sale_id IS NULL;

-- Check for negative stock
SELECT 'Products with negative stock:' as issue;
SELECT COUNT(*) as negative_stock_count
FROM products 
WHERE stock_in_pieces < 0;

-- Check for inconsistent stock movements
SELECT 'Stock movements with calculation errors:' as issue;
SELECT COUNT(*) as inconsistent_movements
FROM stock_movements sm1
WHERE EXISTS (
    SELECT 1 FROM stock_movements sm2 
    WHERE sm2.product_id = sm1.product_id 
    AND sm2.created_at > sm1.created_at
    AND sm2.stock_before != sm1.stock_after
    LIMIT 1
);

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '💡 DIAGNOSTIC COMPLETE!';
    RAISE NOTICE '======================';
    RAISE NOTICE '';
    RAISE NOTICE 'Review the test results above to identify:';
    RAISE NOTICE '• Function availability and compatibility';
    RAISE NOTICE '• Transaction workflow accuracy';
    RAISE NOTICE '• Stock management precision';
    RAISE NOTICE '• Revenue tracking integrity';
    RAISE NOTICE '• System health issues';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps based on results:';
    RAISE NOTICE '1. If tests passed: Your system is working correctly';
    RAISE NOTICE '2. If tests failed: Apply the unified service architecture fix';
    RAISE NOTICE '3. Monitor system for ongoing issues';
    RAISE NOTICE '';
    RAISE NOTICE 'Professional analysis complete! 🚀';
END $$;
