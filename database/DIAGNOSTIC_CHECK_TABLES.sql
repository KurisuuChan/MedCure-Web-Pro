-- ============================================
-- COMPREHENSIVE DIAGNOSTIC CHECK
-- ============================================
-- Run this to understand what's happening in your database

-- 1. Check if the function exists
SELECT 
    routine_name,
    routine_type,
    external_language,
    specific_name
FROM information_schema.routines 
WHERE routine_name = 'create_sale_with_items' 
    AND routine_schema = 'public';

-- 2. Check the actual SALES table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check the actual SALE_ITEMS table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check the actual PRODUCTS table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Test a simple manual function call to see the exact error
DO $$
BEGIN
    PERFORM create_sale_with_items(
        '{"user_id": "b9b31a83-66fd-46e5-b4be-3386c4988f48", "total_amount": 2.8, "payment_method": "cash", "customer_name": "Test Customer", "customer_type": "guest"}'::jsonb,
        ARRAY['{"product_id": "e8c296fa-f79d-4d7b-bcca-d57b0bef0d99", "quantity": 1, "unit_type": "piece", "unit_price": 2.8, "total_price": 2.8}'::jsonb]
    );
    RAISE NOTICE 'Function test succeeded!';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Function test failed: % - %', SQLSTATE, SQLERRM;
END
$$;

-- 6. Show any constraint violations or schema issues
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('sales', 'sale_items', 'products')
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;