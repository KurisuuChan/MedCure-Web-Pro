-- =================================================
-- 🧪 PAYMENT VALIDATION & TEST SCRIPT
-- Run this after the comprehensive fix to ensure everything works
-- =================================================

-- First, let's check our current database structure
SELECT 'Checking database structure...' as step;

-- Verify the users table exists and has data
SELECT COUNT(*) as user_count FROM users;

-- Verify the products table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Verify the sales table structure (should match our stored procedure)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position;

-- Verify the sale_items table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
ORDER BY ordinal_position;

-- Verify the stock_movements table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stock_movements' 
ORDER BY ordinal_position;

-- Check if we have test data
SELECT 'Checking test data availability...' as step;
SELECT COUNT(*) as product_count FROM products WHERE stock_in_pieces > 0;

-- Test the stored procedure with a minimal example
DO $$
DECLARE
    test_user_id UUID;
    test_product_id UUID;
    test_result JSONB;
    test_sale_data JSONB;
    test_sale_items JSONB[];
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    -- Get a test product with stock
    SELECT id INTO test_product_id FROM products WHERE stock_in_pieces > 5 LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_product_id IS NOT NULL THEN
        -- Prepare test data that matches exactly what dataService.js sends
        test_sale_data := jsonb_build_object(
            'user_id', test_user_id::text,
            'total_amount', 100.00,
            'payment_method', 'cash',
            'customer_name', 'Test Customer',
            'customer_phone', '123-456-7890',
            'notes', 'Test transaction',
            'discount_type', 'none',
            'discount_percentage', 0,
            'discount_amount', 0,
            'subtotal_before_discount', 100.00,
            'pwd_senior_id', null
        );
        
        -- Prepare test items array
        test_sale_items := ARRAY[
            jsonb_build_object(
                'product_id', test_product_id::text,
                'quantity', 1,
                'unit_type', 'piece',
                'unit_price', 100.00,
                'total_price', 100.00
            )
        ];
        
        -- Test the stored procedure
        RAISE NOTICE 'Testing stored procedure with user: % and product: %', test_user_id, test_product_id;
        
        SELECT create_sale_with_items(test_sale_data, test_sale_items) INTO test_result;
        
        RAISE NOTICE 'SUCCESS! Test transaction completed. Result: %', test_result::text;
        
        -- Clean up the test data
        DELETE FROM stock_movements WHERE reference_id = (test_result->>'id')::UUID;
        DELETE FROM sale_items WHERE sale_id = (test_result->>'id')::UUID;
        DELETE FROM sales WHERE id = (test_result->>'id')::UUID;
        
        RAISE NOTICE 'Test data cleaned up successfully.';
        
    ELSE
        RAISE NOTICE 'No test data available. Need at least 1 user and 1 product with stock.';
    END IF;
    
END
$$;

-- Final verification
SELECT 'PAYMENT SYSTEM VALIDATION COMPLETE!' as status,
       'If you see SUCCESS above, the payment processing is now working!' as message;
