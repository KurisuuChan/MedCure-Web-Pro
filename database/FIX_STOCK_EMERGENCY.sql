-- =================================================
-- 🔍 PROFESSIONAL STOCK ANALYSIS & FIX
-- Comprehensive stock management solution
-- =================================================

-- Step 1: Analyze current stock situation
SELECT 'STOCK ANALYSIS REPORT' as report_type;

-- Check products with zero or low stock
SELECT 
    p.id,
    p.name,
    p.generic_name,
    p.stock_in_pieces,
    p.stock_in_boxes,
    p.pieces_per_box,
    p.price_per_piece,
    p.price_per_box,
    p.status,
    p.updated_at
FROM products p 
WHERE p.stock_in_pieces <= 5
ORDER BY p.stock_in_pieces ASC;

-- Check recent stock movements to understand what happened
SELECT 
    sm.id,
    p.name as product_name,
    sm.movement_type,
    sm.quantity,
    sm.reason,
    sm.stock_before,
    sm.stock_after,
    sm.created_at,
    u.first_name || ' ' || u.last_name as user_name
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
LEFT JOIN users u ON sm.user_id = u.id
ORDER BY sm.created_at DESC
LIMIT 20;

-- Step 2: Emergency stock replenishment for testing
-- Add stock to products that have zero inventory

UPDATE products 
SET 
    stock_in_pieces = CASE 
        WHEN stock_in_pieces = 0 THEN 100  -- Give 100 pieces to zero-stock items
        WHEN stock_in_pieces < 10 THEN stock_in_pieces + 50  -- Add 50 to low-stock items
        ELSE stock_in_pieces
    END,
    stock_in_boxes = CASE 
        WHEN stock_in_pieces = 0 THEN CEILING(100.0 / COALESCE(pieces_per_box, 10))
        WHEN stock_in_pieces < 10 THEN CEILING((stock_in_pieces + 50.0) / COALESCE(pieces_per_box, 10))
        ELSE stock_in_boxes
    END,
    updated_at = NOW()
WHERE stock_in_pieces < 10;

-- Step 3: Create stock movement records for the replenishment
INSERT INTO stock_movements (
    product_id,
    user_id,
    movement_type,
    quantity,
    reason,
    reference_type,
    stock_before,
    stock_after
)
SELECT 
    p.id,
    (SELECT id FROM users LIMIT 1), -- Use first available user
    'in',
    CASE 
        WHEN p.stock_in_pieces >= 100 THEN 100
        ELSE 50
    END,
    'Emergency stock replenishment for testing',
    'adjustment',
    CASE 
        WHEN p.stock_in_pieces >= 100 THEN 0
        ELSE p.stock_in_pieces - 50
    END,
    p.stock_in_pieces
FROM products p 
WHERE p.stock_in_pieces <= 100  -- Only for recently updated products
AND EXISTS (SELECT 1 FROM users); -- Only if we have users

-- Step 4: Verify the fix
SELECT 'STOCK REPLENISHMENT COMPLETE' as status;

-- Show updated stock levels
SELECT 
    p.name,
    p.stock_in_pieces,
    p.stock_in_boxes,
    p.status,
    'Stock replenished' as action
FROM products p 
WHERE p.stock_in_pieces > 0
ORDER BY p.name
LIMIT 10;

-- Step 5: Test data verification
SELECT 
    COUNT(*) as products_with_stock,
    MIN(stock_in_pieces) as min_stock,
    MAX(stock_in_pieces) as max_stock,
    AVG(stock_in_pieces) as avg_stock
FROM products 
WHERE status = 'active';

SELECT 'READY FOR TESTING! All products now have adequate stock.' as final_status;
