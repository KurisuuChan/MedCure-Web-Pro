-- =====================================================
-- PROFESSIONAL ADVANCED POS DIAGNOSTIC WITH FULL DEBUG
-- =====================================================
-- Enhanced diagnostic with comprehensive debugging information
-- =====================================================

-- ========== SECTION 1: DETAILED DATABASE STRUCTURE ANALYSIS ==========
SELECT '🔍 SECTION 1: DETAILED DATABASE STRUCTURE ANALYSIS' as section_title;

-- Check ALL existing functions (not just stock-related)
SELECT 'ALL database functions:' as check_type;
SELECT 
    routine_name,
    routine_type,
    external_language,
    routine_definition IS NOT NULL as has_definition,
    CASE 
        WHEN routine_name LIKE '%stock%' THEN '🔴 STOCK RELATED'
        WHEN routine_name LIKE '%sale%' THEN '🟡 SALES RELATED'
        WHEN routine_name LIKE '%transaction%' THEN '🟢 TRANSACTION RELATED'
        ELSE '⚪ OTHER'
    END as function_category
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY function_category, routine_name;

-- Check ALL triggers (not just stock-related)
SELECT 'ALL database triggers:' as check_type;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_orientation,
    CASE 
        WHEN action_statement LIKE '%stock%' THEN '🔴 AFFECTS STOCK'
        WHEN action_statement LIKE '%UPDATE products%' THEN '🟡 UPDATES PRODUCTS'
        ELSE '⚪ OTHER'
    END as trigger_impact,
    LEFT(action_statement, 100) as action_preview
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ========== SECTION 2: COMPREHENSIVE DATA STATE ANALYSIS ==========
SELECT '📊 SECTION 2: COMPREHENSIVE DATA STATE ANALYSIS' as section_title;

-- Get detailed product information
SELECT 'Test products with full details:' as info;
SELECT 
    id,
    name,
    stock_in_pieces,
    price_per_piece,
    pieces_per_sheet,
    sheets_per_box,
    reorder_level,
    is_active,
    status,
    created_at,
    updated_at
FROM products 
WHERE stock_in_pieces > 50 
AND is_active = true
ORDER BY stock_in_pieces DESC
LIMIT 3;

-- Detailed sales status analysis
SELECT 'Detailed sales status analysis:' as info;
SELECT 
    status,
    COUNT(*) as count,
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COALESCE(AVG(total_amount), 0) as avg_amount,
    MIN(created_at) as earliest_transaction,
    MAX(created_at) as latest_transaction,
    COUNT(CASE WHEN is_edited = true THEN 1 END) as edited_count
FROM sales 
GROUP BY status
ORDER BY status;

-- Recent transactions with full details
SELECT 'Recent transactions (last 5 with full details):' as info;
SELECT 
    s.id,
    s.status,
    s.total_amount,
    s.payment_method,
    s.is_edited,
    s.edit_reason,
    s.created_at,
    s.updated_at,
    COUNT(si.id) as item_count
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id, s.status, s.total_amount, s.payment_method, s.is_edited, s.edit_reason, s.created_at, s.updated_at
ORDER BY s.created_at DESC
LIMIT 5;

-- Stock movements with product details
SELECT 'Recent stock movements with product details:' as info;
SELECT 
    sm.created_at,
    p.name as product_name,
    p.id as product_id,
    sm.movement_type,
    sm.quantity,
    sm.stock_before,
    sm.stock_after,
    sm.reason,
    sm.reference_type,
    sm.reference_id,
    u.email as user_email
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
JOIN users u ON sm.user_id = u.id
ORDER BY sm.created_at DESC
LIMIT 15;

-- ========== SECTION 3: INTENSIVE LIVE TRANSACTION TEST WITH FULL DEBUG ==========
SELECT '🧪 SECTION 3: INTENSIVE LIVE TRANSACTION TEST WITH FULL DEBUG' as section_title;

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
    initial_completed_count INTEGER;
    completed_after_complete INTEGER;
    completed_after_undo INTEGER;
    initial_cancelled_count INTEGER;
    cancelled_after_undo INTEGER;
    rec RECORD;
    function_exists BOOLEAN;
BEGIN
    -- Get test data with full details
    SELECT id INTO test_user_id FROM users WHERE is_active = true LIMIT 1;
    SELECT id, stock_in_pieces INTO test_product_id, initial_stock 
    FROM products 
    WHERE stock_in_pieces > 100 AND is_active = true
    LIMIT 1;
    
    -- Get comprehensive initial metrics
    SELECT COALESCE(SUM(total_amount), 0) INTO initial_revenue 
    FROM sales WHERE status = 'completed';
    
    SELECT COUNT(*) INTO initial_completed_count 
    FROM sales WHERE status = 'completed';
    
    SELECT COUNT(*) INTO initial_cancelled_count 
    FROM sales WHERE status = 'cancelled';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 INTENSIVE LIVE TRANSACTION TEST WITH FULL DEBUG';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Test Product ID: %', test_product_id;
    RAISE NOTICE 'Test Product Stock: %', initial_stock;
    RAISE NOTICE 'Test User ID: %', test_user_id;
    RAISE NOTICE 'Initial Completed Revenue: %', initial_revenue;
    RAISE NOTICE 'Initial Completed Count: %', initial_completed_count;
    RAISE NOTICE 'Initial Cancelled Count: %', initial_cancelled_count;
    RAISE NOTICE '';
    
    -- TEST FUNCTION EXISTENCE FIRST
    RAISE NOTICE '🔍 CHECKING FUNCTION EXISTENCE:';
    
    -- Check create_sale_with_items
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'create_sale_with_items'
    ) INTO function_exists;
    RAISE NOTICE 'create_sale_with_items exists: %', function_exists;
    
    -- Check complete_transaction_with_stock
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'complete_transaction_with_stock'
    ) INTO function_exists;
    RAISE NOTICE 'complete_transaction_with_stock exists: %', function_exists;
    
    -- Check undo_transaction_completely
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'undo_transaction_completely'
    ) INTO function_exists;
    RAISE NOTICE 'undo_transaction_completely exists: %', function_exists;
    RAISE NOTICE '';
    
    -- STEP 1: CREATE TRANSACTION WITH FULL DEBUG
    RAISE NOTICE '🆕 STEP 1: CREATING TRANSACTION (25 pieces) WITH FULL DEBUG';
    RAISE NOTICE 'Before create - Product stock: %', (SELECT stock_in_pieces FROM products WHERE id = test_product_id);
    
    BEGIN
        SELECT create_sale_with_items(
            jsonb_build_object(
                'user_id', test_user_id,
                'total_amount', 500.00,
                'payment_method', 'cash',
                'notes', 'Advanced diagnostic test with full debug',
                'discount_type', 'none',
                'discount_percentage', 0,
                'discount_amount', 0,
                'subtotal_before_discount', 500.00
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
        RAISE NOTICE '✅ create_sale_with_items SUCCESS';
        RAISE NOTICE 'Transaction ID: %', test_transaction_id;
        RAISE NOTICE 'Function result: %', test_result;
        
        -- Comprehensive post-create analysis
        SELECT stock_in_pieces INTO stock_after_create FROM products WHERE id = test_product_id;
        RAISE NOTICE 'After create - Product stock: % (Expected: % - no change)', stock_after_create, initial_stock;
        
        -- Check transaction status
        FOR rec IN 
            SELECT id, status, total_amount, is_edited, created_at, updated_at
            FROM sales WHERE id = test_transaction_id
        LOOP
            RAISE NOTICE 'Transaction status: % | Amount: % | Edited: % | Created: %', 
                         rec.status, rec.total_amount, rec.is_edited, rec.created_at;
        END LOOP;
        
        -- Check sale items
        FOR rec IN 
            SELECT product_id, quantity, unit_type, unit_price, total_price
            FROM sale_items WHERE sale_id = test_transaction_id
        LOOP
            RAISE NOTICE 'Sale item: Product % | Qty: % | Unit: % | Price: % | Total: %', 
                         rec.product_id, rec.quantity, rec.unit_type, rec.unit_price, rec.total_price;
        END LOOP;
        
        -- Check if any stock movements were created (shouldn't be for pending)
        FOR rec IN 
            SELECT movement_type, quantity, stock_before, stock_after, reason
            FROM stock_movements 
            WHERE product_id = test_product_id 
            AND reference_id = test_transaction_id
        LOOP
            RAISE NOTICE '⚠️  UNEXPECTED: Stock movement during create - % | Qty: % | Before: % | After: %', 
                         rec.movement_type, rec.quantity, rec.stock_before, rec.stock_after;
        END LOOP;
        
        IF stock_after_create = initial_stock THEN
            RAISE NOTICE '✅ CREATE RESULT: CORRECT (no stock deduction on pending transaction)';
        ELSE
            RAISE NOTICE '❌ CREATE RESULT: WRONG (stock deducted: %)', initial_stock - stock_after_create;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ create_sale_with_items FAILED: %', SQLERRM;
        RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
        RETURN;
    END;
    
    RAISE NOTICE '';
    
    -- STEP 2: COMPLETE TRANSACTION WITH INTENSIVE DEBUG
    RAISE NOTICE '💰 STEP 2: COMPLETING TRANSACTION WITH INTENSIVE DEBUG';
    RAISE NOTICE 'Before complete - Product stock: %', (SELECT stock_in_pieces FROM products WHERE id = test_product_id);
    RAISE NOTICE 'Before complete - Revenue: %', (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE status = 'completed');
    
    BEGIN
        SELECT complete_transaction_with_stock(test_transaction_id) INTO test_result;
        RAISE NOTICE '✅ complete_transaction_with_stock SUCCESS';
        RAISE NOTICE 'Function result: %', test_result;
        
        -- Comprehensive post-complete analysis
        SELECT stock_in_pieces INTO stock_after_complete FROM products WHERE id = test_product_id;
        RAISE NOTICE 'After complete - Product stock: % (Expected: %)', stock_after_complete, initial_stock - 25;
        
        SELECT COALESCE(SUM(total_amount), 0) INTO revenue_after_complete 
        FROM sales WHERE status = 'completed';
        RAISE NOTICE 'After complete - Revenue: % (Expected: %)', revenue_after_complete, initial_revenue + 500;
        
        SELECT COUNT(*) INTO completed_after_complete 
        FROM sales WHERE status = 'completed';
        RAISE NOTICE 'After complete - Completed count: % (Expected: %)', completed_after_complete, initial_completed_count + 1;
        
        -- Check transaction status change
        FOR rec IN 
            SELECT id, status, total_amount, is_edited, created_at, updated_at
            FROM sales WHERE id = test_transaction_id
        LOOP
            RAISE NOTICE 'Transaction after complete: Status: % | Amount: % | Updated: %', 
                         rec.status, rec.total_amount, rec.updated_at;
        END LOOP;
        
        -- Check stock movements created during completion
        FOR rec IN 
            SELECT movement_type, quantity, stock_before, stock_after, reason, created_at
            FROM stock_movements 
            WHERE product_id = test_product_id 
            AND reference_id = test_transaction_id
            ORDER BY created_at ASC
        LOOP
            RAISE NOTICE 'Stock movement: % | Qty: % | Before: % | After: % | Reason: %', 
                         rec.movement_type, rec.quantity, rec.stock_before, rec.stock_after, rec.reason;
        END LOOP;
        
        -- Analyze results
        IF stock_after_complete = initial_stock - 25 THEN
            RAISE NOTICE '✅ STOCK DEDUCTION: CORRECT (exactly 25 pieces)';
        ELSIF stock_after_complete = initial_stock - 50 THEN
            RAISE NOTICE '❌ STOCK DEDUCTION: DOUBLED! (50 instead of 25 - trigger interference)';
        ELSE
            RAISE NOTICE '❌ STOCK DEDUCTION: UNEXPECTED! (deducted % instead of 25)', initial_stock - stock_after_complete;
        END IF;
        
        IF revenue_after_complete = initial_revenue + 500 THEN
            RAISE NOTICE '✅ REVENUE TRACKING: CORRECT (added 500.00)';
        ELSE
            RAISE NOTICE '❌ REVENUE TRACKING: WRONG (added % instead of 500)', revenue_after_complete - initial_revenue;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ complete_transaction_with_stock FAILED: %', SQLERRM;
        RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
        RETURN;
    END;
    
    RAISE NOTICE '';
    
    -- STEP 3: UNDO TRANSACTION WITH MAXIMUM DEBUG
    RAISE NOTICE '↩️  STEP 3: UNDOING TRANSACTION WITH MAXIMUM DEBUG';
    RAISE NOTICE 'Before undo - Product stock: %', (SELECT stock_in_pieces FROM products WHERE id = test_product_id);
    RAISE NOTICE 'Before undo - Completed revenue: %', (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE status = 'completed');
    RAISE NOTICE 'Before undo - Cancelled count: %', (SELECT COUNT(*) FROM sales WHERE status = 'cancelled');
    
    BEGIN
        SELECT undo_transaction_completely(test_transaction_id) INTO test_result;
        RAISE NOTICE '✅ undo_transaction_completely SUCCESS';
        RAISE NOTICE 'Function result: %', test_result;
        
        -- Comprehensive post-undo analysis
        SELECT stock_in_pieces INTO stock_after_undo FROM products WHERE id = test_product_id;
        RAISE NOTICE 'After undo - Product stock: % (Expected: % - exact restoration)', stock_after_undo, initial_stock;
        
        SELECT COALESCE(SUM(total_amount), 0) INTO revenue_after_undo 
        FROM sales WHERE status = 'completed';
        RAISE NOTICE 'After undo - Completed revenue: % (Expected: % - exclude cancelled)', revenue_after_undo, initial_revenue;
        
        SELECT COUNT(*) INTO completed_after_undo 
        FROM sales WHERE status = 'completed';
        RAISE NOTICE 'After undo - Completed count: % (Expected: % - back to original)', completed_after_undo, initial_completed_count;
        
        SELECT COUNT(*) INTO cancelled_after_undo 
        FROM sales WHERE status = 'cancelled';
        RAISE NOTICE 'After undo - Cancelled count: % (Expected: % - one new cancellation)', cancelled_after_undo, initial_cancelled_count + 1;
        
        -- Check transaction final status
        FOR rec IN 
            SELECT id, status, total_amount, is_edited, edit_reason, created_at, updated_at, edited_at
            FROM sales WHERE id = test_transaction_id
        LOOP
            RAISE NOTICE 'Transaction after undo: Status: % | Amount: % | Edited: % | Reason: %', 
                         rec.status, rec.total_amount, rec.is_edited, rec.edit_reason;
        END LOOP;
        
        -- Check stock restoration movements
        FOR rec IN 
            SELECT movement_type, quantity, stock_before, stock_after, reason, created_at
            FROM stock_movements 
            WHERE product_id = test_product_id 
            AND reference_id = test_transaction_id
            AND movement_type = 'in'
            ORDER BY created_at DESC
        LOOP
            RAISE NOTICE 'Stock restoration: % | Qty: % | Before: % | After: % | Reason: %', 
                         rec.movement_type, rec.quantity, rec.stock_before, rec.stock_after, rec.reason;
        END LOOP;
        
        -- Analyze undo results
        IF stock_after_undo = initial_stock THEN
            RAISE NOTICE '✅ STOCK RESTORATION: PERFECT (exact restoration to %)', initial_stock;
        ELSE
            RAISE NOTICE '❌ STOCK RESTORATION: WRONG (difference: %)', initial_stock - stock_after_undo;
        END IF;
        
        IF revenue_after_undo = initial_revenue THEN
            RAISE NOTICE '✅ REVENUE RESTORATION: PERFECT (cancelled transaction excluded)';
        ELSE
            RAISE NOTICE '❌ REVENUE RESTORATION: WRONG (cancelled transaction still counted)';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ undo_transaction_completely FAILED: %', SQLERRM;
        RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
    END;
    
    -- COMPREHENSIVE FINAL ANALYSIS
    RAISE NOTICE '';
    RAISE NOTICE '📊 COMPREHENSIVE FINAL ANALYSIS';
    RAISE NOTICE '==============================';
    RAISE NOTICE 'Stock Changes: % → % → % → %', initial_stock, stock_after_create, stock_after_complete, stock_after_undo;
    RAISE NOTICE 'Revenue Changes: % → % → %', initial_revenue, revenue_after_complete, revenue_after_undo;
    RAISE NOTICE '';
    
    -- Show ALL stock movements for this product during test
    RAISE NOTICE '📋 ALL STOCK MOVEMENTS FOR TEST PRODUCT:';
    FOR rec IN 
        SELECT 
            created_at,
            movement_type, 
            quantity, 
            stock_before, 
            stock_after, 
            reason,
            reference_type,
            reference_id
        FROM stock_movements 
        WHERE product_id = test_product_id 
        AND created_at > NOW() - INTERVAL '5 minutes'
        ORDER BY created_at ASC
    LOOP
        RAISE NOTICE '  % | % | Qty:%s | %→% | % (Ref: %)', 
                     rec.created_at, rec.movement_type, rec.quantity, 
                     rec.stock_before, rec.stock_after, rec.reason, rec.reference_type;
    END LOOP;
    
END $$;

-- ========== SECTION 4: DEEP PROBLEM ANALYSIS ==========
SELECT '🎯 SECTION 4: DEEP PROBLEM ANALYSIS' as section_title;

-- Functions that modify stock
SELECT 'Functions that modify product stock:' as issue;
SELECT 
    routine_name, 
    routine_type,
    CASE 
        WHEN routine_definition LIKE '%UPDATE products%SET stock_in_pieces%' THEN '🔴 MODIFIES STOCK'
        WHEN routine_definition LIKE '%stock_in_pieces%' THEN '🟡 REFERENCES STOCK'
        ELSE '⚪ NO STOCK REFERENCE'
    END as stock_impact
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition IS NOT NULL
ORDER BY stock_impact DESC, routine_name;

-- Triggers that could interfere
SELECT 'All triggers with their complete action statements:' as issue;
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Sales table status integrity check
SELECT 'Sales status integrity analysis:' as issue;
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as avg_amount,
    COUNT(CASE WHEN is_edited = true THEN 1 END) as edited_transactions
FROM sales 
GROUP BY status
ORDER BY count DESC;

-- Revenue calculation verification
SELECT 'Revenue calculation verification:' as issue;
SELECT 
    'completed' as status_filter,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_transaction,
    MIN(total_amount) as min_transaction,
    MAX(total_amount) as max_transaction
FROM sales 
WHERE status = 'completed'
UNION ALL
SELECT 
    'cancelled' as status_filter,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_transaction,
    MIN(total_amount) as min_transaction,
    MAX(total_amount) as max_transaction
FROM sales 
WHERE status = 'cancelled';

-- Final diagnostic summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '💡 SECTION 5: ENHANCED DIAGNOSTIC SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'This enhanced diagnostic provides:';
    RAISE NOTICE '✅ Complete function existence verification';
    RAISE NOTICE '✅ Detailed stock movement tracking';
    RAISE NOTICE '✅ Revenue calculation step-by-step analysis';
    RAISE NOTICE '✅ Transaction status change monitoring';
    RAISE NOTICE '✅ Error handling with SQL state codes';
    RAISE NOTICE '✅ Trigger interference detection';
    RAISE NOTICE '';
    RAISE NOTICE 'Review the detailed output above to identify:';
    RAISE NOTICE '1. Missing or broken functions';
    RAISE NOTICE '2. Double stock deduction causes';
    RAISE NOTICE '3. Revenue tracking failures';
    RAISE NOTICE '4. Trigger interference patterns';
    RAISE NOTICE '';
    RAISE NOTICE 'Send this complete output for professional analysis! 🚀';
END $$;
