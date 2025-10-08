-- ============================================
-- COMPREHENSIVE FUNCTION DIAGNOSTIC CHECK
-- ============================================
-- This will help us understand what's happening with the function

-- 1. Check if our function exists and its definition
SELECT 
    proname as function_name,
    pronargs as arg_count,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'create_sale_with_items';

-- 2. Check if there are multiple versions (fixed for your PostgreSQL version)
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_sale_with_items';

-- 3. Test our current function with simple data
SELECT create_sale_with_items(
    jsonb_build_object(
        'user_id', 'b9b31a83-66fd-46e5-b4be-3386c4988f48',
        'total_amount', 1.0,
        'payment_method', 'cash'
    ),
    ARRAY[jsonb_build_object(
        'product_id', (SELECT id FROM products WHERE is_active = true LIMIT 1),
        'quantity', 1,
        'unit_type', 'piece',
        'unit_price', 1.0,
        'total_price', 1.0
    )]
) as test_result;

-- 4. Show the exact sales table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position;

-- 5. Show the exact sale_items table structure  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
ORDER BY ordinal_position;

-- 6. Check for any triggers on sales table that might be causing issues
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'sales';

SELECT '🔍 DIAGNOSTIC CHECK COMPLETE' as status;