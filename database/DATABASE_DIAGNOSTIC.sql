-- =============================================================================
-- DATABASE DIAGNOSTIC SCRIPT
-- =============================================================================
-- Purpose: Comprehensive check of database structure and function availability
-- =============================================================================

-- Check current database structure
SELECT '==== DATABASE STRUCTURE DIAGNOSTICS ====' AS info;

-- 1. Check sale_items table structure
SELECT 
    '1. SALE_ITEMS TABLE STRUCTURE:' AS info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check sales table structure (key columns)
SELECT 
    '2. SALES TABLE STRUCTURE (key columns):' AS info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND table_schema = 'public'
AND column_name IN ('id', 'user_id', 'customer_id', 'total_amount', 'payment_method', 'created_at', 'updated_at', 'pwd_senior_id', 'pwd_senior_holder_name')
ORDER BY ordinal_position;

-- 3. Check products table structure (key columns)
SELECT 
    '3. PRODUCTS TABLE STRUCTURE (key columns):' AS info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
AND column_name IN ('id', 'brand_name', 'generic_name', 'stock_in_pieces', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- 4. Check existing functions
SELECT 
    '4. EXISTING FUNCTIONS:' AS info,
    routine_name, 
    routine_type,
    specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%sale%'
ORDER BY routine_name;

-- 5. Check RLS policies that might affect the function
SELECT 
    '5. RLS POLICIES:' AS info,
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('sales', 'sale_items', 'products')
ORDER BY tablename, policyname;

-- 6. Check table permissions
SELECT 
    '6. TABLE PERMISSIONS:' AS info,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('sales', 'sale_items', 'products')
ORDER BY table_name, grantee;

-- 7. Sample data check (if any)
SELECT 
    '7. SAMPLE DATA COUNT:' AS info,
    'sales' AS table_name,
    COUNT(*) AS record_count
FROM public.sales
UNION ALL
SELECT 
    '',
    'sale_items',
    COUNT(*)
FROM public.sale_items
UNION ALL
SELECT 
    '',
    'products',
    COUNT(*)
FROM public.products;

-- 8. Check if we can create a test function
DO $$
BEGIN
    BEGIN
        -- Try to create a simple test function
        EXECUTE 'CREATE OR REPLACE FUNCTION test_function_creation() RETURNS text AS $test$ BEGIN RETURN ''test''; END; $test$ LANGUAGE plpgsql;';
        
        -- If successful, drop it
        EXECUTE 'DROP FUNCTION test_function_creation();';
        
        RAISE NOTICE '8. FUNCTION CREATION: ✅ Function creation permissions OK';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '8. FUNCTION CREATION: ❌ Function creation failed: %', SQLERRM;
    END;
END $$;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================
SELECT '==== DIAGNOSTIC SUMMARY ====' AS final_summary;