-- =============================================================================
-- FIX ZERO STOCK PRODUCTS
-- =============================================================================
-- Purpose: Set all products with 0 stock to 100 stock
-- Use this if your CSV import had empty stock cells
-- =============================================================================

-- 📊 STEP 1: Show products that will be updated
SELECT 
  '=== PRODUCTS WITH 0 STOCK (WILL BE UPDATED) ===' as section;

SELECT 
  generic_name,
  brand_name,
  category,
  stock_in_pieces AS "Current Stock",
  100 AS "New Stock"
FROM products
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND stock_in_pieces = 0
ORDER BY generic_name;

-- 🔧 STEP 2: Update all 0 stock products to 100
UPDATE products 
SET 
  stock_in_pieces = 100,
  stock_quantity = 100,
  updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND stock_in_pieces = 0;

-- 📊 STEP 3: Verify the fix
SELECT 
  '=== AFTER UPDATE ===' as section;

SELECT 
  COUNT(*) as total_products,
  MIN(stock_in_pieces) as min_stock,
  MAX(stock_in_pieces) as max_stock,
  AVG(stock_in_pieces)::numeric(10,2) as avg_stock,
  SUM(stock_in_pieces) as total_stock,
  COUNT(*) FILTER (WHERE stock_in_pieces = 0) as zero_stock_count
FROM products
WHERE created_at > NOW() - INTERVAL '24 hours';

-- ✅ Expected Result: zero_stock_count should be 0
-- ✅ Expected Result: min_stock should be 100 (not 0)

-- 📊 STEP 4: Show updated products
SELECT 
  generic_name,
  brand_name,
  stock_in_pieces,
  stock_quantity,
  '✅ UPDATED' as status
FROM products
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND updated_at > NOW() - INTERVAL '1 minute'
ORDER BY generic_name
LIMIT 20;
