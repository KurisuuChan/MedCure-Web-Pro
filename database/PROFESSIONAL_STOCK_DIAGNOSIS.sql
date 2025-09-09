-- =================================================
-- 🔬 PROFESSIONAL STOCK MANAGEMENT DIAGNOSIS
-- Comprehensive analysis of current stock system issues
-- =================================================

-- =================================================
-- 1. AUDIT CURRENT SYSTEM STATE
-- =================================================

-- Check all existing triggers on sale_items table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    trigger_schema,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'sale_items'
ORDER BY trigger_name;

-- Check all functions related to stock management
SELECT 
    routinename as function_name,
    routinetype as type,
    data_type as return_type
FROM information_schema.routines 
WHERE routinename LIKE '%stock%' OR routinename LIKE '%sale%'
ORDER BY routinename;

-- =================================================
-- 2. ANALYZE RECENT STOCK MOVEMENTS
-- =================================================

-- Check recent stock movements for patterns
SELECT 
    sm.id,
    sm.created_at,
    p.name as product_name,
    sm.movement_type,
    sm.quantity,
    sm.reason,
    sm.reference_type,
    sm.stock_before,
    sm.stock_after,
    sm.stock_after - sm.stock_before as calculated_change
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
WHERE sm.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY sm.created_at DESC
LIMIT 20;

-- =================================================
-- 3. CHECK FOR DUPLICATE/CONFLICTING STOCK OPERATIONS
-- =================================================

-- Find sales with multiple stock movements (indicating double deduction)
SELECT 
    s.id as sale_id,
    s.created_at,
    s.total_amount,
    p.name as product_name,
    si.quantity as sale_quantity,
    COUNT(sm.id) as stock_movement_count,
    SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as total_deducted,
    SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE 0 END) as total_added
FROM sales s
JOIN sale_items si ON s.id = si.sale_id
JOIN products p ON si.product_id = p.id
LEFT JOIN stock_movements sm ON s.id::text = sm.reference_id AND sm.reference_type = 'sale'
WHERE s.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY s.id, s.created_at, s.total_amount, p.name, si.quantity
HAVING COUNT(sm.id) != si.quantity OR SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) != si.quantity
ORDER BY s.created_at DESC;

-- =================================================
-- 4. CURRENT STOCK LEVELS ANALYSIS
-- =================================================

-- Check current stock levels and recent changes
SELECT 
    p.name,
    p.stock_in_pieces as current_stock,
    p.pieces_per_sheet,
    p.sheets_per_box,
    COALESCE(recent_out.total_out, 0) as recent_deductions,
    COALESCE(recent_in.total_in, 0) as recent_additions,
    COALESCE(recent_out.movement_count, 0) as deduction_count
FROM products p
LEFT JOIN (
    SELECT 
        product_id,
        SUM(quantity) as total_out,
        COUNT(*) as movement_count
    FROM stock_movements 
    WHERE movement_type = 'out' 
    AND created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY product_id
) recent_out ON p.id = recent_out.product_id
LEFT JOIN (
    SELECT 
        product_id,
        SUM(quantity) as total_in
    FROM stock_movements 
    WHERE movement_type = 'in' 
    AND created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY product_id
) recent_in ON p.id = recent_in.product_id
WHERE p.stock_in_pieces < 50 OR recent_out.total_out > 0
ORDER BY p.stock_in_pieces ASC;

-- =================================================
-- 5. CHECK CONSTRAINTS AND TABLE STRUCTURE
-- =================================================

-- Check current table constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'products'::regclass;

-- Check if there are any remaining problematic functions
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc 
WHERE proname LIKE '%stock%' 
AND prosrc LIKE '%UPDATE products%';

SELECT 'Professional diagnosis complete - review results above' as status;
