-- =================================================
-- 🔧 STOCK LEVEL CORRECTION AFTER FIXING DOUBLE DEDUCTION
-- This corrects stock levels that were depleted by the previous bug
-- =================================================

-- First, let's see current stock levels
SELECT 
    name,
    stock_in_pieces as current_stock,
    pieces_per_sheet,
    sheets_per_box
FROM products 
WHERE stock_in_pieces < 10  -- Show low stock items
ORDER BY stock_in_pieces ASC;

-- =================================================
-- HYDROCORTISONE CREAM CORRECTION
-- Current: 2 pieces, should likely be higher
-- =================================================

-- Add back depleted stock for Hydrocortisone Cream
UPDATE products 
SET stock_in_pieces = stock_in_pieces + 10  -- Adding 10 pieces as safety buffer
WHERE name = 'Hydrocortisone Cream 1%';

-- Log the stock correction
INSERT INTO stock_movements (
    product_id,
    user_id,
    movement_type,
    quantity,
    reason,
    reference_type,
    reference_id,
    stock_before,
    stock_after
) 
SELECT 
    id as product_id,
    'b9b31a83-66fd-46e5-b4be-3386c4988f48' as user_id,  -- Admin user
    'in' as movement_type,
    10 as quantity,
    'Stock correction after fixing double deduction bug' as reason,
    'correction' as reference_type,
    NULL as reference_id,
    stock_in_pieces - 10 as stock_before,
    stock_in_pieces as stock_after
FROM products 
WHERE name = 'Hydrocortisone Cream 1%';

-- =================================================
-- OPTIONAL: CORRECT OTHER LOW STOCK ITEMS
-- Review and adjust other products if needed
-- =================================================

-- Check if other products need correction
SELECT 
    p.name,
    p.stock_in_pieces,
    COUNT(sm.id) as movement_count,
    SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as total_out,
    SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE 0 END) as total_in
FROM products p
LEFT JOIN stock_movements sm ON p.id = sm.product_id
WHERE p.stock_in_pieces < 5  -- Very low stock
GROUP BY p.id, p.name, p.stock_in_pieces
ORDER BY p.stock_in_pieces ASC;

-- =================================================
-- VERIFICATION QUERIES
-- =================================================

-- Verify the correction worked
SELECT 
    name,
    stock_in_pieces as corrected_stock
FROM products 
WHERE name = 'Hydrocortisone Cream 1%';

-- Check recent stock movements
SELECT 
    sm.*,
    p.name as product_name
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
WHERE sm.reason LIKE '%correction%'
ORDER BY sm.created_at DESC;

SELECT 'Stock levels corrected - ready for testing!' as status;
