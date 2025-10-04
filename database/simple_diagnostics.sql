-- Simplified diagnostic script to check sale_items table structure
-- Run this in your Supabase SQL editor FIRST

-- 1. Check sale_items table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
ORDER BY ordinal_position;

-- 2. Check sample data from sale_items
SELECT 
    si.*,
    p.generic_name,
    p.brand_name,
    s.created_at as sale_date
FROM sale_items si
LEFT JOIN products p ON p.id = si.product_id
LEFT JOIN sales s ON s.id = si.sale_id
ORDER BY s.created_at DESC
LIMIT 10;

-- 3. Manual verification of top selling calculation
SELECT 
    si.product_id,
    p.generic_name,
    p.brand_name,
    SUM(si.quantity) as total_quantity,
    SUM(COALESCE(si.total_price, 0)) as total_revenue_total_price,
    SUM(COALESCE(p.price * si.quantity, 0)) as total_revenue_calculated,
    COUNT(*) as sale_count
FROM sale_items si
INNER JOIN products p ON p.id = si.product_id
INNER JOIN sales s ON s.id = si.sale_id
WHERE 
    s.created_at >= NOW() - INTERVAL '30 days'
    AND s.status = 'completed'
    AND p.is_archived = false
GROUP BY si.product_id, p.generic_name, p.brand_name
ORDER BY total_quantity DESC
LIMIT 10;