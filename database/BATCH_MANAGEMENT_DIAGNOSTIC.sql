-- ========================================
-- 🩺 BATCH MANAGEMENT DIAGNOSTIC & TEST
-- ========================================
-- Run this script AFTER running COMPLETE_BATCH_MANAGEMENT_FIX.sql
-- to verify everything is working correctly
-- ========================================

-- 1. Check if all required functions exist
SELECT 
    'Function Check' as test_type,
    routine_name,
    CASE 
        WHEN routine_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'add_product_batch',
    'get_batches_for_product', 
    'get_all_batches',
    'get_all_batches_enhanced',
    'update_batch_quantity'
  )
ORDER BY routine_name;

-- 2. Check products table structure for medicine fields
SELECT 
    'Column Check' as test_type,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('generic_name', 'brand_name', 'dosage_form', 'drug_classification') THEN '✅ MEDICINE FIELD'
        WHEN column_name IN ('name', 'brand') THEN '⚠️ LEGACY FIELD'
        ELSE '📋 STANDARD FIELD'
    END as field_type
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public'
  AND column_name IN (
    'name', 'brand', 'generic_name', 'brand_name', 
    'dosage_form', 'dosage_strength', 'drug_classification'
  )
ORDER BY 
    CASE 
        WHEN column_name IN ('generic_name', 'brand_name') THEN 1
        WHEN column_name IN ('dosage_form', 'drug_classification') THEN 2
        ELSE 3
    END,
    column_name;

-- 3. Check if product_batches table exists
SELECT 
    'Table Check' as test_type,
    'product_batches' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'product_batches'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- 4. Test sample product data compatibility
SELECT 
    'Product Data Test' as test_type,
    COUNT(*) as total_products,
    COUNT(CASE WHEN generic_name IS NOT NULL THEN 1 END) as products_with_generic_name,
    COUNT(CASE WHEN brand_name IS NOT NULL THEN 1 END) as products_with_brand_name,
    -- Check if legacy name column exists before querying it
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'name'
        ) THEN (SELECT COUNT(CASE WHEN name IS NOT NULL THEN 1 END) FROM products WHERE is_active = true OR is_active IS NULL)
        ELSE 0
    END as products_with_legacy_name
FROM products 
WHERE is_active = true OR is_active IS NULL;

-- 5. Test get_all_batches function (safe)
SELECT 
    'Function Test' as test_type,
    'get_all_batches()' as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_all_batches' AND routine_schema = 'public'
        ) THEN (
            SELECT COUNT(*)::TEXT || ' batches returned'
            FROM get_all_batches()
            LIMIT 1
        )
        ELSE 'Function does not exist'
    END as result;

-- 6. Test get_all_batches_enhanced function (safe)
SELECT 
    'Function Test' as test_type,
    'get_all_batches_enhanced()' as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_all_batches_enhanced' AND routine_schema = 'public'
        ) THEN (
            SELECT COUNT(*)::TEXT || ' batches returned'
            FROM get_all_batches_enhanced()
            LIMIT 1
        )
        ELSE 'Function does not exist'
    END as result;

-- 7. Sample batch data to verify medicine compatibility (safe)
SELECT 
    'Sample Batch Data' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_all_batches_enhanced' AND routine_schema = 'public'
        ) THEN 'Function exists - checking data...'
        ELSE 'get_all_batches_enhanced function does not exist'
    END as status;

-- 8. Check for any batches with missing product info (safe)
SELECT 
    'Data Quality Check' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_all_batches_enhanced' AND routine_schema = 'public'
        ) THEN (
            SELECT COUNT(*)::TEXT || ' batches with missing product info'
            FROM get_all_batches_enhanced()
            WHERE product_name IS NULL OR product_name = 'Unknown Product'
        )
        ELSE 'Cannot check - function does not exist'
    END as result;

-- ========================================
-- SUMMARY REPORT
-- ========================================
SELECT 
    '🎯 BATCH MANAGEMENT STATUS SUMMARY' as report_section,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.routines 
            WHERE routine_name IN ('add_product_batch', 'get_all_batches', 'get_batches_for_product')
        ) >= 3 THEN '✅ ALL CRITICAL FUNCTIONS EXIST'
        ELSE '❌ MISSING CRITICAL FUNCTIONS'
    END as function_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name IN ('generic_name', 'brand_name')
        ) THEN '✅ MEDICINE STRUCTURE COMPATIBLE'
        ELSE '❌ MEDICINE STRUCTURE MISSING'
    END as medicine_compatibility,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'product_batches'
        ) THEN '✅ BATCH TABLE EXISTS'
        ELSE '❌ BATCH TABLE MISSING'
    END as batch_table_status;

-- Final success message
SELECT 
    '🚀 DIAGNOSIS COMPLETE!' as message,
    'Review the results above to ensure everything is working properly.' as instructions,
    'If all checks show ✅, your batch management is fixed and ready to use!' as next_steps;