-- Comprehensive product data diagnostic
-- Run this in Supabase SQL editor to see all product fields

-- 1. Check the structure of products table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 2. Check all fields of products that appear in recent sales
SELECT DISTINCT
    p.*
FROM products p
INNER JOIN sale_items si ON si.product_id = p.id
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
  AND s.status = 'completed'
ORDER BY p.created_at DESC
LIMIT 10;

-- 3. Check for any other name-related fields
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND (column_name ILIKE '%name%' 
       OR column_name ILIKE '%brand%' 
       OR column_name ILIKE '%generic%'
       OR column_name ILIKE '%title%'
       OR column_name ILIKE '%label%')
ORDER BY column_name;