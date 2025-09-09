-- =====================================================
-- PROFESSIONAL DATABASE DIAGNOSTIC TEST
-- =====================================================
-- Comprehensive test to identify POS issues in your current database
-- =====================================================

-- ========== SECTION 1: DATABASE STRUCTURE ANALYSIS ==========
SELECT '🔍 SECTION 1: DATABASE STRUCTURE ANALYSIS' as section_title;

-- Check existing functions that might cause conflicts
SELECT 'Checking for existing stock management functions...' as check_type;
SELECT 
    routine_name,
    routine_type,
    external_language,
    routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (routine_name LIKE '%stock%' 
     OR routine_name LIKE '%sale%' 
     OR routine_name LIKE '%complete%transaction%'
     OR routine_name LIKE '%undo%transaction%'
     OR routine_name LIKE '%create_sale%')
ORDER BY routine_name;

-- Check for problematic triggers
SELECT 'Checking for stock-related triggers...' as check_type;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('sale_items', 'sales', 'products', 'stock_movements')
AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ========== SECTION 2: CURRENT DATA STATE ==========
SELECT '📊 SECTION 2: CURRENT DATA STATE' as section_title;

-- Get sample data for testing
SELECT 'Sample products for testing:' as info;
SELECT 
    id,
    name,
    stock_in_pieces,
    price_per_piece,
    pieces_per_sheet,
    sheets_per_box
FROM products 
WHERE stock_in_pieces > 100 
AND is_active = true
LIMIT 5;

-- Check current sales status distribution
SELECT 'Current sales status distribution:' as info;
SELECT 
    status,
    COUNT(*) as count,
    COALESCE(SUM(total_amount), 0) as total_revenue
FROM sales 
GROUP BY status
ORDER BY status;

-- Check recent stock movements
SELECT 'Recent stock movements (last 10):' as info;
SELECT 
    sm.created_at,
    p.name as product_name,
    sm.movement_type,
    sm.quantity,
    sm.stock_before,
    sm.stock_after,
    sm.reason,
    sm.reference_type
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
ORDER BY sm.created_at DESC
LIMIT 10;

-- ========== SECTION 3: LIVE TRANSACTION TEST ==========
SELECT '🧪 SECTION 3: LIVE TRANSACTION TEST' as section_title;

DO $$
DECLARE
    test_product_id UUID;
    test_user_id UUID;
    initial_stock INTEGER;
    test_transaction_id UUID;
    test_result JSONB;
    stock_after_create INTEGER;
    stock_after_complete INTEGER;
    stock_after_undo INTEGER;
    initial_revenue NUMERIC;
    revenue_after_complete NUMERIC;
    revenue_after_undo NUMERIC;
    rec RECORD;
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
    
    RAISE NOTICE '🎯 STARTING LIVE TRANSACTION TEST';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Test Product: % (Stock: %)', test_product_id, initial_stock;
    RAISE NOTICE 'Test User: %', test_user_id;
    RAISE NOTICE 'Initial Revenue: %', initial_revenue;
    RAISE NOTICE '';
    
    -- TEST 1: Check if create_sale_with_items function exists
    BEGIN
        SELECT create_sale_with_items(
            jsonb_build_object(
                'user_id', test_user_id,
                'total_amount', 500.00,
                'payment_method', 'cash',
                'notes', 'Database diagnostic test'
            ),
            ARRAY[
                jsonb_build_object(
                    'product_id', test_product_id,
                    'quantity', 25,
                    'unit_type', 'piece',
                    'unit_price', 20.00,
                    'total_price', 500.00
                )
            ]
        ) INTO test_result;
        
        test_transaction_id := (test_result->>'id')::UUID;
        RAISE NOTICE '✅ create_sale_with_items works: %', test_transaction_id;
        
        -- Check stock after creation (should be unchanged for pending)
        SELECT stock_in_pieces INTO stock_after_create FROM products WHERE id = test_product_id;
        RAISE NOTICE '📦 Stock after create: % (Expected: % - no change)', stock_after_create, initial_stock;
        
        IF stock_after_create = initial_stock THEN
            RAISE NOTICE '✅ CORRECT: No stock deduction on sale creation (pending status)';
        ELSE
            RAISE NOTICE '❌ PROBLEM: Stock was deducted on sale creation! (Unexpected behavior)';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ create_sale_with_items function missing or broken: %', SQLERRM;
        RETURN;
    END;
    
    -- TEST 2: Check if complete_transaction_with_stock function exists
    BEGIN
        SELECT complete_transaction_with_stock(test_transaction_id) INTO test_result;
        RAISE NOTICE '✅ complete_transaction_with_stock works: %', test_result;
        
        -- Check stock after completion
        SELECT stock_in_pieces INTO stock_after_complete FROM products WHERE id = test_product_id;
        RAISE NOTICE '📦 Stock after complete: % (Expected: %)', stock_after_complete, initial_stock - 25;
        
        -- Check revenue after completion
        SELECT COALESCE(SUM(total_amount), 0) INTO revenue_after_complete 
        FROM sales WHERE status = 'completed';
        RAISE NOTICE '💵 Revenue after complete: % (Expected: %)', revenue_after_complete, initial_revenue + 500;
        
        -- Analyze stock deduction
        IF stock_after_complete = initial_stock - 25 THEN
            RAISE NOTICE '✅ STOCK DEDUCTION: CORRECT (single deduction)';
        ELSIF stock_after_complete = initial_stock - 50 THEN
            RAISE NOTICE '❌ STOCK DEDUCTION: DOUBLED! (Triggers interfering)';
        ELSE
            RAISE NOTICE '❌ STOCK DEDUCTION: UNEXPECTED! (Deducted % instead of 25)', initial_stock - stock_after_complete;
        END IF;
        
        -- Analyze revenue tracking
        IF revenue_after_complete = initial_revenue + 500 THEN
            RAISE NOTICE '✅ REVENUE TRACKING: CORRECT';
        ELSE
            RAISE NOTICE '❌ REVENUE TRACKING: WRONG (Added % instead of 500)', revenue_after_complete - initial_revenue;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ complete_transaction_with_stock function missing or broken: %', SQLERRM;
        RETURN;
    END;
    
    -- TEST 3: Check if undo_transaction_completely function exists
    BEGIN
        SELECT undo_transaction_completely(test_transaction_id) INTO test_result;
        RAISE NOTICE '✅ undo_transaction_completely works: %', test_result;
        
        -- Check stock after undo
        SELECT stock_in_pieces INTO stock_after_undo FROM products WHERE id = test_product_id;
        RAISE NOTICE '📦 Stock after undo: % (Expected: %)', stock_after_undo, initial_stock;
        
        -- Check revenue after undo
        SELECT COALESCE(SUM(total_amount), 0) INTO revenue_after_undo 
        FROM sales WHERE status = 'completed';
        RAISE NOTICE '💵 Revenue after undo: % (Expected: %)', revenue_after_undo, initial_revenue;
        
        -- Analyze stock restoration
        IF stock_after_undo = initial_stock THEN
            RAISE NOTICE '✅ STOCK RESTORATION: PERFECT';
        ELSE
            RAISE NOTICE '❌ STOCK RESTORATION: WRONG (Difference: %)', initial_stock - stock_after_undo;
        END IF;
        
        -- Analyze revenue restoration
        IF revenue_after_undo = initial_revenue THEN
            RAISE NOTICE '✅ REVENUE RESTORATION: PERFECT';
        ELSE
            RAISE NOTICE '❌ REVENUE RESTORATION: WRONG (Still includes cancelled transaction)';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ undo_transaction_completely function missing or broken: %', SQLERRM;
    END;
    
    -- Show detailed stock movements for this test
    RAISE NOTICE '';
    RAISE NOTICE '📋 STOCK MOVEMENTS FROM THIS TEST:';
    FOR rec IN 
        SELECT 
            movement_type, 
            quantity, 
            stock_before, 
            stock_after, 
            reason, 
            created_at
        FROM stock_movements 
        WHERE product_id = test_product_id 
        AND created_at > NOW() - INTERVAL '2 minutes'
        ORDER BY created_at ASC
    LOOP
        RAISE NOTICE '  % | Qty: % | Before: % | After: % | %', 
                     rec.movement_type, rec.quantity, rec.stock_before, 
                     rec.stock_after, rec.reason;
    END LOOP;
    
END $$;

-- ========== SECTION 4: PROBLEM IDENTIFICATION ==========
SELECT '🎯 SECTION 4: PROBLEM IDENTIFICATION' as section_title;

-- Check for common issues
SELECT 'Checking for common POS issues...' as check_type;

-- Issue 1: Multiple stock deduction functions
SELECT 'Functions that might cause double deduction:' as issue;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition LIKE '%UPDATE products%SET stock_in_pieces%'
ORDER BY routine_name;

-- Issue 2: Automatic triggers
SELECT 'Triggers that might auto-deduct stock:' as issue;
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND (action_statement LIKE '%stock%' OR action_statement LIKE '%UPDATE products%')
ORDER BY trigger_name;

-- Issue 3: Revenue calculation issues
SELECT 'Checking transaction status that might affect revenue:' as issue;
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_amount,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM sales 
GROUP BY status
ORDER BY status;

-- ========== SECTION 5: RECOMMENDATIONS ==========
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '💡 SECTION 5: DIAGNOSTIC SUMMARY & RECOMMENDATIONS';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Based on the test results above, here are the likely issues:';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 COMMON ISSUES TO LOOK FOR:';
    RAISE NOTICE '1. Double Stock Deduction:';
    RAISE NOTICE '   - Look for triggers on sale_items that auto-deduct stock';
    RAISE NOTICE '   - Check if multiple functions update stock for same transaction';
    RAISE NOTICE '';
    RAISE NOTICE '2. Revenue Not Updating on Undo:';
    RAISE NOTICE '   - Check if undo function sets status to "cancelled"';
    RAISE NOTICE '   - Verify revenue calculations exclude cancelled transactions';
    RAISE NOTICE '';
    RAISE NOTICE '3. Missing Functions:';
    RAISE NOTICE '   - create_sale_with_items should create pending transactions';
    RAISE NOTICE '   - complete_transaction_with_stock should deduct stock once';
    RAISE NOTICE '   - undo_transaction_completely should restore stock and cancel';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT STEPS:';
    RAISE NOTICE '1. Review the test results above';
    RAISE NOTICE '2. Identify which specific issues your database has';
    RAISE NOTICE '3. Apply the targeted fixes for those issues';
    RAISE NOTICE '';
    RAISE NOTICE 'Run this diagnostic test in your Supabase SQL Editor now!';
END $$;
