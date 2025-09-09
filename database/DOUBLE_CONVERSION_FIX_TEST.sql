-- =====================================================
-- DOUBLE CONVERSION FIX VERIFICATION TEST
-- =====================================================
-- Test to verify the double conversion issue is fixed
-- =====================================================

-- Test Case: Buy 1 Box (50 pieces) then Undo - should restore exact stock
DO $$
DECLARE
    test_product_id UUID;
    initial_stock INTEGER;
    after_sale_stock INTEGER;
    after_undo_stock INTEGER;
    test_transaction_id UUID;
    test_result JSONB;
    rec RECORD;
BEGIN
    -- Get a product for testing
    SELECT id, stock_in_pieces INTO test_product_id, initial_stock 
    FROM products 
    WHERE stock_in_pieces > 100 
    LIMIT 1;
    
    IF test_product_id IS NULL THEN
        RAISE NOTICE '❌ No product with sufficient stock found for testing';
        RETURN;
    END IF;
    
    RAISE NOTICE '🧪 Testing with product: % (Initial stock: %)', test_product_id, initial_stock;
    
    -- STEP 1: Create a sale with 50 pieces (equivalent to 1 box)
    -- This simulates the frontend sending quantity_in_pieces = 50, unit_type = "piece"
    SELECT create_sale_with_items(
        jsonb_build_object(
            'user_id', (SELECT id FROM users LIMIT 1),
            'total_amount', 1000.00,
            'payment_method', 'cash',
            'customer_name', null,
            'customer_phone', null,
            'notes', 'Test double conversion fix',
            'discount_type', 'none',
            'discount_percentage', 0,
            'discount_amount', 0,
            'subtotal_before_discount', 1000.00,
            'pwd_senior_id', null
        ),
        ARRAY[
            jsonb_build_object(
                'product_id', test_product_id,
                'quantity', 50, -- quantity in pieces (fixed: was display quantity)
                'unit_type', 'piece', -- always "piece" (fixed: was original unit)
                'unit_price', 20.00,
                'total_price', 1000.00
            )
        ]
    ) INTO test_result;
    
    test_transaction_id := (test_result->>'id')::UUID;
    
    -- Check stock after pending sale (should be unchanged)
    SELECT stock_in_pieces INTO after_sale_stock FROM products WHERE id = test_product_id;
    RAISE NOTICE '📦 After pending sale - Stock: % (Expected: % - no change)', after_sale_stock, initial_stock;
    
    -- STEP 2: Complete the transaction (this should deduct stock)
    SELECT complete_transaction_with_stock(test_transaction_id) INTO test_result;
    
    -- Check stock after completion
    SELECT stock_in_pieces INTO after_sale_stock FROM products WHERE id = test_product_id;
    RAISE NOTICE '💰 After completion - Stock: % (Expected: %)', after_sale_stock, initial_stock - 50;
    
    -- STEP 3: Undo the transaction (should restore exact stock)
    SELECT undo_transaction_completely(test_transaction_id) INTO test_result;
    
    -- Check final stock
    SELECT stock_in_pieces INTO after_undo_stock FROM products WHERE id = test_product_id;
    RAISE NOTICE '↩️  After undo - Stock: % (Expected: % - exact restoration)', after_undo_stock, initial_stock;
    
    -- Verify results
    IF after_undo_stock = initial_stock THEN
        RAISE NOTICE '✅ SUCCESS: Stock perfectly restored! No double conversion issue.';
    ELSE
        RAISE NOTICE '❌ FAILED: Stock not restored correctly. Double conversion still exists.';
        RAISE NOTICE '📊 Expected: %, Got: %, Difference: %', 
                     initial_stock, after_undo_stock, (initial_stock - after_undo_stock);
    END IF;
    
    -- Show stock movements for debugging
    RAISE NOTICE '📋 Stock movements for this test:';
    FOR rec IN 
        SELECT movement_type, stock_before, stock_after, quantity, created_at
        FROM stock_movements 
        WHERE product_id = test_product_id 
        AND created_at > NOW() - INTERVAL '1 minute'
        ORDER BY created_at ASC
    LOOP
        RAISE NOTICE '  % | Before: % | After: % | Changed: % | Time: %', 
                     rec.movement_type, rec.stock_before, rec.stock_after, 
                     rec.quantity, rec.created_at;
    END LOOP;
    
END $$;

-- Show summary
SELECT 'DOUBLE CONVERSION FIX TEST COMPLETED' as status;
