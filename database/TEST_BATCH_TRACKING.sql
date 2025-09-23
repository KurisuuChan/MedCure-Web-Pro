-- ========================================
-- 🔍 BATCH TRACKING DIAGNOSTIC SCRIPT
-- ========================================
-- Run this AFTER setting up the batch tracking system
-- This will test if everything is working properly

-- 1. Check if tables exist
SELECT 'product_batches table exists' as check_name, 
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'product_batches'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as result
UNION ALL
SELECT 'inventory_logs table exists' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'inventory_logs'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as result;

-- 2. Check if RPC functions exist
SELECT 'add_product_batch function exists' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.routines 
           WHERE routine_name = 'add_product_batch'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as result
UNION ALL
SELECT 'get_batches_for_product function exists' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.routines 
           WHERE routine_name = 'get_batches_for_product'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as result
UNION ALL
SELECT 'get_all_batches function exists' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.routines 
           WHERE routine_name = 'get_all_batches'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as result;

-- 3. Check if you have any products to test with
SELECT 'Products available for testing' as check_name,
       CASE WHEN COUNT(*) > 0 
            THEN '✅ FOUND ' || COUNT(*) || ' products'
            ELSE '❌ NO PRODUCTS FOUND'
       END as result
FROM products 
WHERE is_active = true;

-- 4. Show sample products (first 3) for testing
SELECT id, name, stock_in_pieces 
FROM products 
WHERE is_active = true 
LIMIT 3;

-- ========================================
-- 🧪 TEST BATCH OPERATIONS
-- ========================================
-- Uncomment these lines ONLY if you want to test with real data:

-- Test adding a batch (replace with real product ID):
-- SELECT add_product_batch(
--     'your-product-id-here'::uuid,
--     50,
--     'TEST-BATCH-001',
--     '2024-12-31'::date
-- );

-- Test getting all batches:
-- SELECT * FROM get_all_batches();

-- Test getting batches for specific product:
-- SELECT * FROM get_batches_for_product('your-product-id-here'::uuid);

-- ========================================
-- 📊 CURRENT BATCH STATUS
-- ========================================
-- Show current batch data (if any exists)
SELECT 
    COUNT(*) as total_batches,
    COUNT(CASE WHEN quantity > 0 THEN 1 END) as active_batches,
    COUNT(CASE WHEN quantity = 0 THEN 1 END) as depleted_batches,
    COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired_batches
FROM product_batches;

SELECT 
    COUNT(*) as total_inventory_logs,
    COUNT(DISTINCT product_id) as products_with_logs,
    COUNT(DISTINCT action) as different_actions
FROM inventory_logs;