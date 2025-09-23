-- Debug query to check what's happening with customer IDs
-- Run this in Supabase SQL Editor to see current state

-- 1. Check recent sales with customer info
SELECT 
    id,
    customer_id,
    customer_name, 
    customer_phone,
    customer_type,
    created_at
FROM public.sales 
WHERE created_at >= NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if customers table has data
SELECT 
    id,
    customer_name,
    phone,
    created_at
FROM public.customers 
WHERE created_at >= NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Test the create_sale_with_items function manually
SELECT create_sale_with_items(
    '{"user_id": "00000000-0000-0000-0000-000000000000", "total_amount": 100, "payment_method": "cash", "customer_id": "11111111-1111-1111-1111-111111111111", "customer_name": "Test Customer", "customer_phone": "1234567890"}'::jsonb,
    ARRAY['{"product_id": "22222222-2222-2222-2222-222222222222", "quantity": 1, "unit_type": "piece", "unit_price": 100, "total_price": 100}'::jsonb]
);

-- 4. Check if the function definition is updated
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'create_sale_with_items' 
AND routine_schema = 'public';