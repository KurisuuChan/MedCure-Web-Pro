-- =================================================
-- 🔍 DIAGNOSTIC SQL - CHECK PAYMENT FUNCTION STATUS
-- Run this to see what's happening with your stored procedure
-- =================================================

-- 1. Check all existing functions related to sales
SELECT 
    'EXISTING FUNCTIONS' as check_type,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosrc as function_body_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%sale%' 
   OR p.proname LIKE '%create_sale%'
   AND n.nspname = 'public'
ORDER BY p.proname;

-- 2. Check stock_movements table structure
SELECT 
    'STOCK_MOVEMENTS_TABLE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stock_movements'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check batch_movements table structure
SELECT 
    'BATCH_MOVEMENTS_TABLE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'batch_movements'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check which tables exist
SELECT 
    'EXISTING_TABLES' as check_type,
    table_name,
    CASE 
        WHEN table_name = 'stock_movements' THEN 'OLD_SYSTEM'
        WHEN table_name = 'batch_movements' THEN 'NEW_SYSTEM'
        WHEN table_name = 'batches' THEN 'NEW_SYSTEM'
        ELSE 'CORE'
    END as system_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('stock_movements', 'batch_movements', 'batches', 'sales', 'sale_items', 'products', 'users')
ORDER BY system_type, table_name;

-- 5. Check the exact function definition that's currently deployed
SELECT 
    'CURRENT_FUNCTION_DEFINITION' as check_type,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_sale_with_items'
  AND n.nspname = 'public';

-- 6. Check for any triggers that might be calling the old function
SELECT 
    'TRIGGERS_CHECK' as check_type,
    t.trigger_name,
    t.event_object_table,
    t.action_statement
FROM information_schema.triggers t
WHERE t.trigger_schema = 'public'
  AND (t.action_statement LIKE '%stock_movements%' OR t.action_statement LIKE '%quantity_changed%');

-- 7. Test if the function can be called (simple syntax check)
SELECT 
    'FUNCTION_CALLABLE_TEST' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE p.proname = 'create_sale_with_items' 
              AND n.nspname = 'public'
              AND p.pronargs = 2
        ) THEN 'FUNCTION_EXISTS_WITH_2_PARAMS'
        ELSE 'FUNCTION_NOT_FOUND_OR_WRONG_PARAMS'
    END as status;

-- 8. Check for any stored procedure caching issues
SELECT 
    'FUNCTION_CACHE_INFO' as check_type,
    p.proname,
    p.oid,
    p.proowner,
    p.prolang,
    p.procost,
    p.prorows
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_sale_with_items'
  AND n.nspname = 'public';

-- 9. Check recent function modifications
SELECT 
    'RECENT_FUNCTION_ACTIVITY' as check_type,
    schemaname,
    tablename,
    attname,
    n_distinct,
    most_common_vals
FROM pg_stats
WHERE schemaname = 'public'
  AND tablename IN ('pg_proc')
LIMIT 5;

-- 10. Final summary
SELECT 
    'SUMMARY' as check_type,
    'Check complete - review results above' as message,
    NOW() as timestamp;
