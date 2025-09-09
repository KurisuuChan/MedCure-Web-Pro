-- =====================================================
-- COMPREHENSIVE STOCK OPERATION DIAGNOSTIC
-- =====================================================

-- Check 1: What functions currently exist in the database
DO $$
BEGIN
    RAISE NOTICE '=== EXISTING STOCK-RELATED FUNCTIONS ===';
END $$;

SELECT proname as function_name, prosrc as function_source 
FROM pg_proc 
WHERE proname LIKE '%sale%' OR proname LIKE '%stock%' OR proname LIKE '%transaction%'
ORDER BY proname;

-- Check 2: Recent stock movements to see patterns
DO $$
BEGIN
    RAISE NOTICE '=== RECENT STOCK MOVEMENTS ===';
END $$;

SELECT 
    sm.created_at,
    p.name as product_name,
    sm.movement_type,
    sm.quantity,
    sm.reason,
    sm.stock_before,
    sm.stock_after,
    sm.reference_id,
    sm.reference_type
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
ORDER BY sm.created_at DESC
LIMIT 20;

-- Check 3: Current product stock levels
DO $$
BEGIN
    RAISE NOTICE '=== CURRENT PRODUCT STOCK LEVELS ===';
END $$;

SELECT 
    name,
    stock_in_pieces,
    pieces_per_sheet,
    sheets_per_box
FROM products
WHERE stock_in_pieces > 0
ORDER BY name
LIMIT 10;

-- Check 4: Test a specific product's stock trail
DO $$
BEGIN
    RAISE NOTICE '=== TESTING STOCK TRAIL FOR FIRST AVAILABLE PRODUCT ===';
END $$;

WITH first_product AS (
    SELECT id, name FROM products WHERE stock_in_pieces > 0 LIMIT 1
)
SELECT 
    fp.name,
    sm.created_at,
    sm.movement_type,
    sm.quantity,
    sm.reason,
    sm.stock_before,
    sm.stock_after,
    (sm.stock_after - sm.stock_before) as actual_change,
    CASE 
        WHEN sm.movement_type = 'out' THEN -sm.quantity
        WHEN sm.movement_type = 'in' THEN sm.quantity
        ELSE 0
    END as expected_change
FROM stock_movements sm
JOIN first_product fp ON sm.product_id = fp.id
ORDER BY sm.created_at DESC
LIMIT 10;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '=== DIAGNOSTIC COMPLETE ===';
    RAISE NOTICE 'Check the results above to identify:';
    RAISE NOTICE '1. Which functions exist in the database';
    RAISE NOTICE '2. What stock movements are being recorded';
    RAISE NOTICE '3. If calculations match expected values';
END $$;
