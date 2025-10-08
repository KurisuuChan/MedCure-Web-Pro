-- =============================================================================
-- QUICK STOCK FIX & VERIFY
-- =============================================================================
-- Run this single query to fix and verify stock display issue
-- =============================================================================

-- Fix: Sync stock_quantity with stock_in_pieces
UPDATE products 
SET stock_quantity = stock_in_pieces
WHERE stock_in_pieces IS NOT NULL
  AND stock_in_pieces > 0
  AND (stock_quantity IS NULL OR stock_quantity != stock_in_pieces);

-- Verify: Show synced products
SELECT 
  generic_name,
  brand_name,
  stock_in_pieces AS "Stock (Pieces)",
  stock_quantity AS "Stock (Quantity)",
  CASE 
    WHEN stock_in_pieces = stock_quantity THEN '✅ SYNCED'
    ELSE '❌ MISMATCH'
  END as "Status",
  created_at
FROM products
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;
