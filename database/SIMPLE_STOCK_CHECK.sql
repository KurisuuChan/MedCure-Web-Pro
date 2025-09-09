-- =================================================
-- 🔍 SIMPLE STOCK SYSTEM STATUS CHECK
-- Quick diagnosis to see what's wrong with your database
-- =================================================

-- 1. CHECK WHAT TRIGGERS ARE CURRENTLY ACTIVE
SELECT 
    'ACTIVE TRIGGERS' as check_type,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'sale_items'
ORDER BY trigger_name;

-- 2. CHECK WHAT STOCK FUNCTIONS EXIST
SELECT 
    'STOCK FUNCTIONS' as check_type,
    routine_name as function_name,
    routine_type as type
FROM information_schema.routines 
WHERE routine_name LIKE '%stock%' OR routine_name LIKE '%sale%'
ORDER BY routine_name;

-- 3. CHECK RECENT STOCK MOVEMENTS (LOOK FOR DOUBLE ENTRIES)
SELECT 
    'RECENT MOVEMENTS' as check_type,
    sm.created_at,
    p.name as product,
    sm.movement_type,
    sm.quantity,
    sm.reason,
    sm.reference_type
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
WHERE sm.created_at >= NOW() - INTERVAL '2 hours'
ORDER BY sm.created_at DESC
LIMIT 10;

-- 4. CHECK FOR DUPLICATE STOCK DEDUCTIONS
SELECT 
    'PROBLEM DETECTION' as check_type,
    s.id as sale_id,
    p.name as product,
    si.quantity as should_deduct,
    COUNT(sm.id) as actual_movements,
    SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as total_deducted
FROM sales s
JOIN sale_items si ON s.id = si.sale_id
JOIN products p ON si.product_id = p.id
LEFT JOIN stock_movements sm ON s.id = sm.reference_id::uuid
WHERE s.created_at >= NOW() - INTERVAL '2 hours'
GROUP BY s.id, p.name, si.quantity
HAVING COUNT(sm.id) > 1 OR SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) != si.quantity;

-- 5. CHECK CURRENT STOCK LEVELS
SELECT 
    'CURRENT STOCK' as check_type,
    name as product,
    stock_in_pieces as current_stock
FROM products 
WHERE stock_in_pieces < 20
ORDER BY stock_in_pieces;

-- SUMMARY
SELECT 
    'DIAGNOSIS SUMMARY' as result,
    'Check the results above:' as instruction,
    '1. Multiple triggers = CONFLICT PROBLEM' as issue1,
    '2. Duplicate movements = DOUBLE DEDUCTION' as issue2,
    '3. Wrong stock levels = SYSTEM BROKEN' as issue3;
