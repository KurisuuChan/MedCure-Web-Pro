-- =============================================================================
-- DIAGNOSE & FIX STOCK_QUANTITY DEFAULT VALUE
-- =============================================================================
-- Purpose: Check if stock_quantity has a database default causing the issue
-- =============================================================================

-- 📊 STEP 1: Check column defaults
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('stock_in_pieces', 'stock_quantity')
ORDER BY ordinal_position;

-- 📊 STEP 2: Check recent imports
SELECT 
  generic_name,
  stock_in_pieces,
  stock_quantity,
  created_at,
  CASE 
    WHEN stock_in_pieces IS NOT NULL AND stock_quantity = 0 THEN '❌ MISMATCH'
    WHEN stock_in_pieces = stock_quantity THEN '✅ SYNCED'
    ELSE '⚠️ OTHER'
  END as status
FROM products
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- 🔧 STEP 3: Remove default value from stock_quantity (if it exists)
-- Uncomment if stock_quantity has a default value of 0
/*
ALTER TABLE products 
ALTER COLUMN stock_quantity DROP DEFAULT;
*/

-- 🔧 STEP 4: Fix all existing products with mismatched stock
UPDATE products 
SET stock_quantity = stock_in_pieces
WHERE stock_in_pieces IS NOT NULL
  AND stock_in_pieces > 0
  AND (stock_quantity IS NULL OR stock_quantity = 0 OR stock_quantity != stock_in_pieces);

-- 📊 STEP 5: Verify everything is fixed
SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE stock_in_pieces = stock_quantity) as synced,
  COUNT(*) FILTER (WHERE stock_in_pieces != stock_quantity OR stock_quantity IS NULL) as mismatched
FROM products
WHERE stock_in_pieces IS NOT NULL;

-- ✅ If mismatched = 0, everything is fixed!
