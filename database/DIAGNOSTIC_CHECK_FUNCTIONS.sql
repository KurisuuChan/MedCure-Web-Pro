-- =================================================
-- 🔍 DIAGNOSTIC - CHECK CURRENT STORED PROCEDURES
-- This will help us see what functions are currently in the database
-- =================================================

-- Check all functions related to sales
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosrc as source_code_snippet
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND (p.proname LIKE '%sale%' OR p.proname LIKE '%stock%')
ORDER BY p.proname;

-- Check if stock_movements table exists and its structure
SELECT 
    'stock_movements table exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_movements') 
         THEN 'YES' 
         ELSE 'NO' 
    END as stock_movements_status;

-- If it exists, show its columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stock_movements' 
ORDER BY ordinal_position;

-- Check if batch_movements table exists
SELECT 
    'batch_movements table exists: ' || 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'batch_movements') 
         THEN 'YES' 
         ELSE 'NO' 
    END as batch_movements_status;

-- Show any triggers that might be affecting the stored procedure
SELECT 
    trigger_name,
    table_name,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%stock%' OR trigger_name LIKE '%sale%';

SELECT 'DIAGNOSTIC COMPLETE - Check results above' as status;
