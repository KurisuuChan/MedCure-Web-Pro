-- =====================================================
-- DETAILED STOCK MANAGEMENT DIAGNOSTIC
-- =====================================================
-- This will identify exactly what's causing the double deduction
-- and stock restoration issues
-- =====================================================

-- Check 1: Active Triggers on Sales Table
SELECT 
    'ACTIVE_TRIGGERS' as diagnostic_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'sales'
ORDER BY trigger_name;

-- Check 2: Stock-Related Functions
SELECT 
    'STOCK_FUNCTIONS' as diagnostic_type,
    routine_name as function_name,
    routine_type,
    external_language
FROM information_schema.routines 
WHERE routine_name LIKE '%stock%' 
   OR routine_name LIKE '%sale%'
   OR routine_name LIKE '%transaction%'
ORDER BY routine_name;

-- Check 3: Recent Stock Movements (Last 10)
SELECT 
    'RECENT_MOVEMENTS' as diagnostic_type,
    sm.created_at,
    p.name as product_name,
    sm.movement_type,
    sm.quantity,
    sm.reason,
    sm.reference_type,
    sm.stock_before,
    sm.stock_after
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
ORDER BY sm.created_at DESC
LIMIT 10;

-- Check 4: Products with Recent Stock Changes
SELECT 
    'STOCK_LEVELS' as diagnostic_type,
    p.name as product_name,
    p.stock_in_pieces as current_stock,
    COUNT(sm.id) as movement_count,
    SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as total_deductions,
    SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE 0 END) as total_additions
FROM products p
LEFT JOIN stock_movements sm ON p.id = sm.product_id
WHERE p.updated_at > NOW() - INTERVAL '1 hour'
GROUP BY p.id, p.name, p.stock_in_pieces
ORDER BY p.updated_at DESC;

-- Check 5: Recent Sales and Their Stock Impact
SELECT 
    'SALES_IMPACT' as diagnostic_type,
    s.id as sale_id,
    s.created_at,
    s.status,
    si.product_id,
    p.name as product_name,
    si.quantity as sale_quantity,
    COUNT(sm.id) as movement_records
FROM sales s
JOIN sale_items si ON s.id = si.sale_id
JOIN products p ON si.product_id = p.id
LEFT JOIN stock_movements sm ON si.product_id = sm.product_id 
    AND sm.reference_id::TEXT = s.id::TEXT
WHERE s.created_at > NOW() - INTERVAL '1 hour'
GROUP BY s.id, s.created_at, s.status, si.product_id, p.name, si.quantity
ORDER BY s.created_at DESC;

-- Check 6: Duplicate Stock Movements Detection
SELECT 
    'DUPLICATES' as diagnostic_type,
    product_id,
    reference_id,
    reference_type,
    quantity,
    COUNT(*) as duplicate_count
FROM stock_movements 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY product_id, reference_id, reference_type, quantity
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check 7: Function Source Code Inspection
SELECT 
    'FUNCTION_CODE' as diagnostic_type,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('edit_transaction_with_stock_management', 'process_sale_professional', 'log_stock_movement')
ORDER BY routine_name;
