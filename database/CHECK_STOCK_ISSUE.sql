-- =============================================================================
-- CHECK STOCK IMPORT ISSUE
-- =============================================================================
-- Purpose: Diagnose why stock is showing 0 after import
-- =============================================================================

-- 📊 STEP 1: Check if products have stock_in_pieces in database
SELECT 
  '=== STOCK DATA CHECK ===' as section;

SELECT 
  generic_name,
  brand_name,
  category,
  stock_in_pieces,
  reorder_level,
  price_per_piece,
  created_at
FROM products
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY generic_name
LIMIT 20;

-- 📊 STEP 2: Check for NULL or 0 stock values
SELECT 
  '=== ZERO STOCK PRODUCTS ===' as section;

SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE stock_in_pieces IS NULL) as null_stock,
  COUNT(*) FILTER (WHERE stock_in_pieces = 0) as zero_stock,
  COUNT(*) FILTER (WHERE stock_in_pieces > 0) as has_stock
FROM products
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 📊 STEP 3: Check actual stock values
SELECT 
  '=== STOCK DISTRIBUTION ===' as section;

SELECT 
  CASE 
    WHEN stock_in_pieces IS NULL THEN 'NULL'
    WHEN stock_in_pieces = 0 THEN 'ZERO'
    WHEN stock_in_pieces BETWEEN 1 AND 50 THEN '1-50'
    WHEN stock_in_pieces BETWEEN 51 AND 100 THEN '51-100'
    ELSE '100+'
  END as stock_range,
  COUNT(*) as count
FROM products
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 
  CASE 
    WHEN stock_in_pieces IS NULL THEN 'NULL'
    WHEN stock_in_pieces = 0 THEN 'ZERO'
    WHEN stock_in_pieces BETWEEN 1 AND 50 THEN '1-50'
    WHEN stock_in_pieces BETWEEN 51 AND 100 THEN '51-100'
    ELSE '100+'
  END
ORDER BY stock_range;

-- 📊 STEP 4: Check products table structure
SELECT 
  '=== TABLE STRUCTURE ===' as section;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('stock_in_pieces', 'stock_quantity', 'reorder_level')
ORDER BY ordinal_position;

-- 📊 STEP 5: Sample products with their full stock data
SELECT 
  '=== SAMPLE PRODUCTS WITH STOCK ===' as section;

SELECT 
  generic_name,
  brand_name,
  stock_in_pieces,
  stock_quantity,
  reorder_level,
  pieces_per_sheet,
  sheets_per_box,
  price_per_piece
FROM products
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY generic_name
LIMIT 10;

-- 📊 STEP 6: Check if there's a mismatch between stock_in_pieces and stock_quantity
SELECT 
  '=== STOCK FIELD COMPARISON ===' as section;

SELECT 
  'Products where stock_in_pieces != stock_quantity' as issue,
  COUNT(*) as count
FROM products
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND (stock_in_pieces IS DISTINCT FROM stock_quantity);

-- 🔧 FIX: If stock_quantity is being used instead of stock_in_pieces
-- Uncomment to sync stock_quantity with stock_in_pieces
/*
UPDATE products 
SET stock_quantity = stock_in_pieces
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND stock_in_pieces IS NOT NULL
  AND (stock_quantity IS NULL OR stock_quantity = 0);
*/
