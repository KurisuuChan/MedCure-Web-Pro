-- ============================================
-- TEST CUSTOMER TRANSACTION FLOW
-- ============================================
-- Test both walk-in customers and real customers

-- First, run the updated function
\i COMPLETE_CUSTOMER_TRANSACTION_FIX.sql

-- Test 1: Walk-in customer transaction (no phone)
SELECT 'TEST 1: WALK-IN CUSTOMER TRANSACTION' as test_name;

SELECT create_sale_with_items(
    jsonb_build_object(
        'user_id', 'b9b31a83-66fd-46e5-b4be-3386c4988f48',
        'total_amount', 10.0,
        'payment_method', 'cash',
        'customer_name', 'Walk-in Customer',
        'customer_phone', '',  -- Empty phone for walk-in
        'customer_email', '',
        'customer_address', '',
        'customer_type', 'guest'
    ),
    ARRAY[jsonb_build_object(
        'product_id', (SELECT id FROM products WHERE is_active = true AND stock_in_pieces > 0 LIMIT 1),
        'quantity', 1,
        'unit_type', 'piece',
        'unit_price', 10.0,
        'total_price', 10.0
    )]
) as walk_in_result;

-- Test 2: Real customer transaction (with phone)
SELECT 'TEST 2: REAL CUSTOMER TRANSACTION' as test_name;

SELECT create_sale_with_items(
    jsonb_build_object(
        'user_id', 'b9b31a83-66fd-46e5-b4be-3386c4988f48',
        'total_amount', 15.0,
        'payment_method', 'cash',
        'customer_name', 'John Doe',
        'customer_phone', '09123456789',  -- Real phone number
        'customer_email', 'john@example.com',
        'customer_address', '123 Main St',
        'customer_type', 'regular'
    ),
    ARRAY[jsonb_build_object(
        'product_id', (SELECT id FROM products WHERE is_active = true AND stock_in_pieces > 0 LIMIT 1),
        'quantity', 1,
        'unit_type', 'piece',
        'unit_price', 15.0,
        'total_price', 15.0
    )]
) as real_customer_result;

-- Check the results
SELECT 'RECENT TRANSACTIONS AFTER TEST:' as check_name;

SELECT 
    id,
    customer_id,
    customer_name,
    customer_phone,
    customer_email,
    customer_type,
    total_amount,
    created_at
FROM sales 
ORDER BY created_at DESC 
LIMIT 3;

-- Check if real customer was created in customers table
SELECT 'CUSTOMERS TABLE AFTER TEST:' as check_name;

SELECT 
    id,
    customer_name,
    phone,
    email,
    created_at
FROM customers 
ORDER BY created_at DESC 
LIMIT 3;

SELECT '🎯 CUSTOMER TRANSACTION FLOW TEST COMPLETE!' as status;