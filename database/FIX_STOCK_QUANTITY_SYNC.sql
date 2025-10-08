-- =============================================================================
-- FIX STOCK QUANTITY SYNC
-- =============================================================================
-- Purpose: Sync stock_quantity with stock_in_pieces for imported products
-- Root Cause: CSV import correctly saves stock_in_pieces, but stock_quantity
--             was left at 0, causing display issues in UI components that
--             might read stock_quantity
-- =============================================================================

-- 📊 STEP 1: Check current state
SELECT 
  '=== BEFORE FIX ===' as section;

SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE stock_in_pieces > 0 AND stock_quantity = 0) as needs_fix,
  COUNT(*) FILTER (WHERE stock_in_pieces = stock_quantity) as already_synced
FROM products
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 🔧 STEP 2: Sync stock_quantity with stock_in_pieces
UPDATE products 
SET 
  stock_quantity = stock_in_pieces,
  updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND stock_in_pieces IS NOT NULL
  AND stock_in_pieces > 0
  AND (stock_quantity IS NULL OR stock_quantity = 0 OR stock_quantity != stock_in_pieces);

-- 📊 STEP 3: Verify the fix
SELECT 
  '=== AFTER FIX ===' as section;

SELECT 
  generic_name,
  brand_name,
  stock_in_pieces,
  stock_quantity,
  CASE 
    WHEN stock_in_pieces = stock_quantity THEN '✅ SYNCED'
    ELSE '❌ MISMATCH'
  END as status
FROM products
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY generic_name
LIMIT 20;

-- 📊 STEP 4: Summary
SELECT 
  '=== SUMMARY ===' as section;

SELECT 
  COUNT(*) as total_updated_products,
  SUM(stock_in_pieces) as total_stock_pieces,
  AVG(stock_in_pieces) as avg_stock_per_product
FROM products
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND stock_in_pieces > 0;

-- ✅ SUCCESS: All imported products now have stock_quantity synced with stock_in_pieces
-- 📝 NOTE: Future imports will automatically sync both fields (fixed in productService.js)
