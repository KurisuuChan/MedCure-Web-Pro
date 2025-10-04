-- Check what the transaction data actually shows
-- Run this to see the exact product data from your recent sales

-- Check the top selling products with all their details
SELECT 
    si.product_id,
    p.generic_name,
    p.brand_name,
    SUM(si.quantity) as total_quantity,
    SUM(si.total_price) as total_revenue,
    COUNT(*) as transaction_count
FROM sale_items si
INNER JOIN products p ON p.id = si.product_id
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
  AND s.status = 'completed'
GROUP BY si.product_id, p.generic_name, p.brand_name
ORDER BY total_quantity DESC
LIMIT 10;

-- Alternative: check if products have different field names
SELECT 
    si.product_id,
    p.*,  -- Get all product fields
    SUM(si.quantity) as sales_qty
FROM sale_items si
INNER JOIN products p ON p.id = si.product_id  
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
  AND s.status = 'completed'
GROUP BY si.product_id, p.id
ORDER BY sales_qty DESC
LIMIT 3;