-- =====================================================
-- SPECIFIC BUY/UNDO CYCLE DIAGNOSTIC
-- =====================================================

-- Step 1: Choose a test product and record current stock
DO $$
DECLARE
    test_product_id UUID;
    test_product_name TEXT;
    current_stock INTEGER;
BEGIN
    -- Get a product with sufficient stock for testing
    SELECT id, name, stock_in_pieces 
    INTO test_product_id, test_product_name, current_stock
    FROM products 
    WHERE stock_in_pieces >= 10 
    LIMIT 1;
    
    RAISE NOTICE '=== TEST PRODUCT SELECTED ===';
    RAISE NOTICE 'Product: % (ID: %)', test_product_name, test_product_id;
    RAISE NOTICE 'Current Stock: % pieces', current_stock;
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS FOR MANUAL TESTING:';
    RAISE NOTICE '1. Buy this product from POS';
    RAISE NOTICE '2. Note stock after purchase';
    RAISE NOTICE '3. Undo the transaction';
    RAISE NOTICE '4. Check if stock returns to: %', current_stock;
    RAISE NOTICE '5. Run this diagnostic again to see stock movements';
END $$;

-- Step 2: Show recent movements for debugging
SELECT 
    p.name,
    sm.created_at,
    sm.movement_type,
    sm.quantity,
    sm.reason,
    sm.stock_before,
    sm.stock_after,
    (sm.stock_after - sm.stock_before) as actual_change,
    sm.reference_type,
    SUBSTRING(sm.reference_id::text, 1, 8) as ref_id_short
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
WHERE sm.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY sm.created_at DESC
LIMIT 10;

-- Step 3: Check for any active triggers or functions that might interfere
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING FOR INTERFERING FUNCTIONS ===';
END $$;

-- List all functions that contain stock operations
SELECT 
    proname as function_name,
    CASE 
        WHEN prosrc LIKE '%stock_in_pieces%' THEN 'MODIFIES STOCK'
        ELSE 'No stock modification'
    END as stock_impact
FROM pg_proc 
WHERE prosrc LIKE '%stock_in_pieces%' 
   OR prosrc LIKE '%UPDATE products%'
   OR proname LIKE '%sale%'
ORDER BY function_name;

-- Step 4: Check for triggers on products table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'products';

-- Step 5: Unit conversion check - show a sample product's conversion rates
SELECT 
    name,
    pieces_per_sheet,
    sheets_per_box,
    (pieces_per_sheet * sheets_per_box) as pieces_per_box_calculated,
    stock_in_pieces
FROM products 
WHERE pieces_per_sheet > 1 OR sheets_per_box > 1
LIMIT 5;

DO $$ 
BEGIN
    RAISE NOTICE '=== DIAGNOSTIC COMPLETE ===';
    RAISE NOTICE 'Look for:';
    RAISE NOTICE '1. Functions that modify stock_in_pieces';
    RAISE NOTICE '2. Any triggers on products table';
    RAISE NOTICE '3. Unit conversion issues';
    RAISE NOTICE '4. Multiple stock movements for single transaction';
END $$;
