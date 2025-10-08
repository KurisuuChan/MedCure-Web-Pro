-- =============================================================================
-- VERIFY STOCK DATA IS CORRECT
-- =============================================================================
-- Run this to confirm the database has the correct stock values
-- =============================================================================

-- Show the most recently imported products with their stock
SELECT 
  generic_name,
  brand_name,
  category,
  stock_in_pieces AS "Stock In Pieces",
  stock_quantity AS "Stock Quantity", 
  price_per_piece AS "Price",
  created_at AS "Imported At"
FROM products
WHERE created_at > NOW() - INTERVAL '30 minutes'
ORDER BY created_at DESC
LIMIT 20;

-- Summary of stock values
SELECT 
  '=== STOCK SUMMARY (Last 30 min) ===' as info;

SELECT 
  COUNT(*) as total_products,
  MIN(stock_in_pieces) as min_stock,
  MAX(stock_in_pieces) as max_stock,
  AVG(stock_in_pieces)::numeric(10,2) as avg_stock,
  SUM(stock_in_pieces) as total_stock
FROM products
WHERE created_at > NOW() - INTERVAL '30 minutes';
