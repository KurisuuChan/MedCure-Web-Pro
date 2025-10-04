-- ============================================
-- EMERGENCY DEBUG: Let's test exactly what's happening
-- ============================================

-- First, let's check if our function exists and works
SELECT 
    routine_name,
    routine_type,
    external_language
FROM information_schema.routines 
WHERE routine_name = 'create_sale_with_items' 
    AND routine_schema = 'public';

-- Let's try a super simple test call to see what happens
DO $$
DECLARE
    test_result JSONB;
BEGIN
    -- Try the function with minimal data
    SELECT create_sale_with_items(
        '{"user_id": "b9b31a83-66fd-46e5-b4be-3386c4988f48", "total_amount": 1.0, "payment_method": "cash"}'::jsonb,
        ARRAY['{"product_id": "e8c296fa-f79d-4d7b-bcca-d57b0bef0d99", "quantity": 1, "unit_price": 1.0, "total_price": 1.0}'::jsonb]
    ) INTO test_result;
    
    RAISE NOTICE 'SUCCESS: Function worked! Result: %', test_result;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: % - %', SQLSTATE, SQLERRM;
END
$$;

-- Let's also check what the current products table looks like
SELECT 
    id, 
    generic_name, 
    brand_name, 
    stock_in_pieces,
    price_per_piece
FROM products 
WHERE is_active = true 
LIMIT 3;