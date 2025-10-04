-- Test if the RPC function exists and returns data
-- Run this in Supabase SQL editor to debug

-- 1. Check if function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_top_selling_products';

-- 2. Test function execution with error handling
DO $$
BEGIN
    BEGIN
        PERFORM get_top_selling_products(30, 5);
        RAISE NOTICE 'Function exists and executes successfully';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Function error: %', SQLERRM;
    END;
END $$;

-- 3. Direct test of function call
SELECT 
    'Direct function call:' as test_type,
    COUNT(*) as result_count
FROM get_top_selling_products(30, 5);

-- 4. Test function with different parameters
SELECT * FROM get_top_selling_products(30, 5);

-- 5. Check recent sales data exists
SELECT 
    'Sales data check:' as test_type,
    COUNT(*) as total_sales,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_sales,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_sales
FROM sales;

-- 6. Check sale_items data exists
SELECT 
    'Sale items check:' as test_type,
    COUNT(*) as total_sale_items,
    COUNT(DISTINCT product_id) as unique_products
FROM sale_items si
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
  AND s.status = 'completed';