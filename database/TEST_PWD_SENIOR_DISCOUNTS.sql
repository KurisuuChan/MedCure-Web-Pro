-- =================================================
-- 🧪 PWD/SENIOR DISCOUNT DEBUG & TEST SCRIPT
-- Run this to diagnose and test PWD/Senior discount issues
-- =================================================

-- First, let's create some test data if none exists
DO $$
DECLARE
    test_user_id UUID;
    test_product_id UUID;
BEGIN
    -- Check if we have a test user
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    -- Check if we have a test product
    SELECT id INTO test_product_id FROM products WHERE stock_in_pieces > 10 LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found. Please ensure you have users in the database.';
    ELSE
        RAISE NOTICE 'Found test user: %', test_user_id;
    END IF;
    
    IF test_product_id IS NULL THEN
        RAISE NOTICE 'No products with sufficient stock found. Please ensure you have products with stock > 10.';
    ELSE
        RAISE NOTICE 'Found test product: % with stock available', test_product_id;
    END IF;
END
$$;

-- Test PWD Discount Processing
DO $$
DECLARE
    test_user_id UUID;
    test_product_id UUID;
    test_result JSONB;
    test_sale_data JSONB;
    test_sale_items JSONB[];
    subtotal DECIMAL := 100.00;
    pwd_discount_amount DECIMAL := 20.00; -- 20% of 100
    final_total DECIMAL := 80.00; -- 100 - 20
BEGIN
    -- Get test data
    SELECT id INTO test_user_id FROM users LIMIT 1;
    SELECT id INTO test_product_id FROM products WHERE stock_in_pieces > 5 LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_product_id IS NOT NULL THEN
        RAISE NOTICE '=== TESTING PWD DISCOUNT ===';
        
        -- Prepare PWD discount sale data
        test_sale_data := jsonb_build_object(
            'user_id', test_user_id::text,
            'total_amount', final_total, -- Final amount after discount
            'payment_method', 'cash',
            'customer_name', 'Test PWD Customer',
            'customer_phone', '123-456-7890',
            'notes', 'PWD Test Transaction',
            'discount_type', 'pwd',
            'discount_percentage', 20,
            'discount_amount', pwd_discount_amount,
            'subtotal_before_discount', subtotal,
            'pwd_senior_id', 'PWD123456789'
        );
        
        -- Prepare test items
        test_sale_items := ARRAY[
            jsonb_build_object(
                'product_id', test_product_id::text,
                'quantity', 1,
                'unit_type', 'piece',
                'unit_price', subtotal,
                'total_price', subtotal
            )
        ];
        
        RAISE NOTICE 'PWD Test Data - Subtotal: %, Discount: %, Final: %', subtotal, pwd_discount_amount, final_total;
        RAISE NOTICE 'PWD ID: %', 'PWD123456789';
        
        -- Test the stored procedure
        SELECT create_sale_with_items(test_sale_data, test_sale_items) INTO test_result;
        
        RAISE NOTICE 'PWD SUCCESS! Result: %', test_result::text;
        
        -- Verify the saved data
        RAISE NOTICE 'Verifying PWD sale data was saved correctly...';
        
        -- Clean up
        DELETE FROM stock_movements WHERE reference_id = (test_result->>'id')::UUID;
        DELETE FROM sale_items WHERE sale_id = (test_result->>'id')::UUID;
        DELETE FROM sales WHERE id = (test_result->>'id')::UUID;
        
        RAISE NOTICE 'PWD test data cleaned up.';
        RAISE NOTICE '';
        
    END IF;
END
$$;

-- Test Senior Citizen Discount Processing
DO $$
DECLARE
    test_user_id UUID;
    test_product_id UUID;
    test_result JSONB;
    test_sale_data JSONB;
    test_sale_items JSONB[];
    subtotal DECIMAL := 150.00;
    senior_discount_amount DECIMAL := 30.00; -- 20% of 150
    final_total DECIMAL := 120.00; -- 150 - 30
BEGIN
    -- Get test data
    SELECT id INTO test_user_id FROM users LIMIT 1;
    SELECT id INTO test_product_id FROM products WHERE stock_in_pieces > 5 LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_product_id IS NOT NULL THEN
        RAISE NOTICE '=== TESTING SENIOR CITIZEN DISCOUNT ===';
        
        -- Prepare Senior discount sale data
        test_sale_data := jsonb_build_object(
            'user_id', test_user_id::text,
            'total_amount', final_total, -- Final amount after discount
            'payment_method', 'card',
            'customer_name', 'Test Senior Customer',
            'customer_phone', '987-654-3210',
            'notes', 'Senior Citizen Test Transaction',
            'discount_type', 'senior',
            'discount_percentage', 20,
            'discount_amount', senior_discount_amount,
            'subtotal_before_discount', subtotal,
            'pwd_senior_id', 'SENIOR987654321'
        );
        
        -- Prepare test items
        test_sale_items := ARRAY[
            jsonb_build_object(
                'product_id', test_product_id::text,
                'quantity', 1,
                'unit_type', 'piece',
                'unit_price', subtotal,
                'total_price', subtotal
            )
        ];
        
        RAISE NOTICE 'Senior Test Data - Subtotal: %, Discount: %, Final: %', subtotal, senior_discount_amount, final_total;
        RAISE NOTICE 'Senior ID: %', 'SENIOR987654321';
        
        -- Test the stored procedure
        SELECT create_sale_with_items(test_sale_data, test_sale_items) INTO test_result;
        
        RAISE NOTICE 'SENIOR SUCCESS! Result: %', test_result::text;
        
        -- Verify the saved data
        RAISE NOTICE 'Verifying Senior sale data was saved correctly...';
        
        -- Clean up
        DELETE FROM stock_movements WHERE reference_id = (test_result->>'id')::UUID;
        DELETE FROM sale_items WHERE sale_id = (test_result->>'id')::UUID;
        DELETE FROM sales WHERE id = (test_result->>'id')::UUID;
        
        RAISE NOTICE 'Senior test data cleaned up.';
        RAISE NOTICE '';
        
    END IF;
END
$$;

-- Verify the sales table structure supports discount fields
SELECT 'Checking sales table discount columns...' as step;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales' 
  AND column_name IN ('discount_type', 'discount_percentage', 'discount_amount', 'subtotal_before_discount', 'pwd_senior_id')
ORDER BY column_name;

-- Show some real examples if any exist
SELECT 'Checking existing discount transactions...' as step;
SELECT id, discount_type, discount_percentage, discount_amount, pwd_senior_id, total_amount, subtotal_before_discount
FROM sales 
WHERE discount_type != 'none' AND discount_type IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

SELECT 'PWD/SENIOR DISCOUNT TESTING COMPLETE!' as status;
