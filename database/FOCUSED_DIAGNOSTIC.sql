-- =================================================
-- 🔍 FOCUSED DIAGNOSTIC - GET EXACT PROBLEM
-- Run this to see the exact issue with your payment function
-- =================================================

-- Check the current function definition
SELECT 
    'CURRENT_FUNCTION' as check,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_sale_with_items'
  AND n.nspname = 'public';

-- Check if stock_movements table exists and its structure
SELECT 
    'STOCK_MOVEMENTS_COLUMNS' as check,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_name = 'stock_movements'
  AND table_schema = 'public';

-- Check which movement tables exist
SELECT 
    'TABLES_EXIST' as check,
    table_name,
    'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('stock_movements', 'batch_movements', 'batches')
ORDER BY table_name;

-- Check for any functions that might contain "quantity_changed"
SELECT 
    'FUNCTIONS_WITH_QUANTITY_CHANGED' as check,
    p.proname,
    CASE WHEN p.prosrc LIKE '%quantity_changed%' THEN 'CONTAINS_QUANTITY_CHANGED' ELSE 'CLEAN' END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%sale%' OR p.prosrc LIKE '%quantity_changed%');
