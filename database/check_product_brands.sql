-- Check the actual product data to see brand names
-- Run this in Supabase SQL editor

-- Check products that appear in recent sales
SELECT DISTINCT
    p.id,
    p.generic_name,
    p.brand_name,
    p.brand_name IS NULL as brand_is_null,
    p.brand_name = '' as brand_is_empty,
    p.brand_name = 'Unknown Brand' as brand_is_unknown,
    LENGTH(p.brand_name) as brand_length
FROM products p
INNER JOIN sale_items si ON si.product_id = p.id
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
  AND s.status = 'completed'
ORDER BY p.generic_name;

-- Test the case logic
SELECT 
    p.generic_name,
    p.brand_name,
    CASE 
      WHEN p.brand_name IS NOT NULL AND p.brand_name != '' AND p.brand_name != 'Unknown Brand'
      THEN p.brand_name || ' (' || p.generic_name || ')'
      ELSE p.generic_name
    END as formatted_name
FROM products p
INNER JOIN sale_items si ON si.product_id = p.id
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
  AND s.status = 'completed'
GROUP BY p.id, p.generic_name, p.brand_name
ORDER BY p.generic_name;