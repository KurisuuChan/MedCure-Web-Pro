-- ============================================
-- DIAGNOSE TOP SELLING PRODUCTS FUNCTION
-- ============================================

-- 1. Check sale_items table structure
SELECT 
    'SALE_ITEMS TABLE STRUCTURE:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
ORDER BY ordinal_position;

-- 2. Check sample sale_items data
SELECT 
    'SAMPLE SALE_ITEMS DATA:' as info,
    si.*
FROM sale_items si
LIMIT 3;

-- 3. Test the current function
SELECT 
    'CURRENT FUNCTION RESULTS:' as info,
    *
FROM get_top_selling_products(30, 5);

-- 4. Manual query to see what should be returned
SELECT 
    'MANUAL TOP PRODUCTS QUERY:' as info,
    si.product_id,
    CASE 
      WHEN p.brand_name IS NOT NULL AND p.brand_name != '' 
      THEN p.brand_name || ' (' || p.generic_name || ')'
      ELSE p.generic_name
    END as product_name,
    SUM(si.quantity) as total_quantity,
    SUM(si.total_price) as total_revenue  -- Using total_price instead of subtotal
FROM sale_items si
INNER JOIN products p ON p.id = si.product_id
INNER JOIN sales s ON s.id = si.sale_id
WHERE 
    s.created_at >= NOW() - INTERVAL '30 days'
    AND s.status = 'completed'
    AND p.is_archived = false
GROUP BY si.product_id, p.generic_name, p.brand_name
ORDER BY total_quantity DESC
LIMIT 5;

-- 5. Check if there are any completed sales
SELECT 
    'COMPLETED SALES COUNT:' as info,
    COUNT(*) as completed_sales_count
FROM sales 
WHERE status = 'completed' 
AND created_at >= NOW() - INTERVAL '30 days';

SELECT '🔍 TOP PRODUCTS DIAGNOSTIC COMPLETE' as status;