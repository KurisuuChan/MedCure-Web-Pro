-- 🔍 DATABASE DIAGNOSTIC QUERIES
-- Run these in Supabase SQL Editor to check system status

-- 1. CHECK EXISTING DATABASE FUNCTIONS
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%sale%' OR routine_name LIKE '%transaction%'
ORDER BY routine_name;

-- 2. CHECK FOR COMPETING TRIGGERS
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table IN ('sales', 'sale_items')
ORDER BY event_object_table, trigger_name;

-- 3. CHECK SALES TABLE STRUCTURE
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales'
ORDER BY ordinal_position;

-- 4. CHECK RECENT TRANSACTIONS STATUS
SELECT 
    id,
    status,
    total_amount,
    created_at,
    payment_method
FROM sales 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. CHECK STOCK LEVELS (TOP 10 PRODUCTS)
SELECT 
    name,
    stock_in_pieces,
    price_per_piece,
    is_active
FROM products 
WHERE is_active = true
ORDER BY stock_in_pieces DESC
LIMIT 10;

-- 6. CHECK FOR ORPHANED PENDING TRANSACTIONS
SELECT 
    id,
    status,
    total_amount,
    created_at,
    (CURRENT_TIMESTAMP - created_at) as age
FROM sales 
WHERE status = 'pending'
AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 hour'
ORDER BY created_at;

-- 7. REVENUE CALCULATION TEST
SELECT 
    status,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue
FROM sales 
GROUP BY status
ORDER BY status;

-- 8. CHECK FOR SALE_ITEMS INTEGRITY
SELECT 
    s.id as sale_id,
    s.status,
    s.total_amount,
    COUNT(si.id) as item_count,
    SUM(si.total_price) as items_total
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE s.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY s.id, s.status, s.total_amount
HAVING s.total_amount != COALESCE(SUM(si.total_price), 0)
ORDER BY s.created_at DESC;

-- 9. MANUAL TRIGGER CLEANUP (IF NEEDED)
-- UNCOMMENT AND RUN ONLY IF YOU FIND COMPETING TRIGGERS:

-- DROP TRIGGER IF EXISTS trigger_deduct_stock_on_sale ON sale_items;
-- DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sales;
-- DROP TRIGGER IF EXISTS professional_stock_management_trigger ON sale_items;
-- DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_item_delete ON sale_items;

-- 10. TEST FUNCTION EXISTENCE
-- This will show if the required functions exist:
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_sale_with_items') 
        THEN 'EXISTS' ELSE 'MISSING' 
    END as create_sale_with_items,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'complete_transaction_with_stock') 
        THEN 'EXISTS' ELSE 'MISSING' 
    END as complete_transaction_with_stock,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'undo_transaction_completely') 
        THEN 'EXISTS' ELSE 'MISSING' 
    END as undo_transaction_completely,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'edit_transaction_with_stock_management') 
        THEN 'EXISTS' ELSE 'MISSING' 
    END as edit_transaction_with_stock_management;
