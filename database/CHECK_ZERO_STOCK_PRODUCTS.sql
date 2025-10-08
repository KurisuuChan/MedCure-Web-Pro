-- =============================================================================
-- CHECK WHICH PRODUCTS HAVE ZERO STOCK
-- =============================================================================
-- Purpose: Identify which products were imported with 0 stock
-- =============================================================================

-- 📊 Show all products with 0 stock from recent import
SELECT 
  generic_name,
  brand_name,
  category,
  stock_in_pieces,
  stock_quantity,
  created_at
FROM products
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND (stock_in_pieces = 0 OR stock_in_pieces IS NULL)
ORDER BY generic_name;

-- 📊 Show stock distribution
SELECT 
  CASE 
    WHEN stock_in_pieces = 0 THEN '0 stock'
    WHEN stock_in_pieces BETWEEN 1 AND 50 THEN '1-50'
    WHEN stock_in_pieces BETWEEN 51 AND 99 THEN '51-99'
    WHEN stock_in_pieces = 100 THEN '100'
    ELSE 'Other'
  END as stock_range,
  COUNT(*) as product_count,
  array_agg(generic_name ORDER BY generic_name) FILTER (WHERE stock_in_pieces = 0) as zero_stock_products
FROM products
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY 
  CASE 
    WHEN stock_in_pieces = 0 THEN '0 stock'
    WHEN stock_in_pieces BETWEEN 1 AND 50 THEN '1-50'
    WHEN stock_in_pieces BETWEEN 51 AND 99 THEN '51-99'
    WHEN stock_in_pieces = 100 THEN '100'
    ELSE 'Other'
  END
ORDER BY stock_range;

-- 📊 Compare with expected products
-- Check if these products match what's in your CSV
SELECT 
  '=== PRODUCTS WITH STOCK ===' as section;
  
SELECT 
  generic_name,
  brand_name,
  stock_in_pieces,
  price_per_piece
FROM products
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND stock_in_pieces > 0
ORDER BY generic_name
LIMIT 10;
