-- ============================================
-- BATCH TRACKING SYSTEM - TEST QUERIES
-- ============================================
-- Run these after setting up the main functions to test everything works

-- Test 1: Check if tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('product_batches', 'inventory_logs');

-- Test 2: Check if functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('add_product_batch', 'get_batches_for_product', 'get_all_batches')
AND routine_schema = 'public';

-- Test 3: Count existing records
SELECT 
    'products' as table_name, 
    COUNT(*) as record_count 
FROM products
UNION ALL
SELECT 
    'product_batches' as table_name, 
    COUNT(*) as record_count 
FROM product_batches
UNION ALL
SELECT 
    'inventory_logs' as table_name, 
    COUNT(*) as record_count 
FROM inventory_logs;

-- Test 4: Test adding a batch (replace with actual product ID)
-- First, get a product ID to test with:
SELECT id, name FROM products WHERE is_active = true LIMIT 1;

-- Then use that ID in this test (replace 'YOUR_PRODUCT_ID_HERE' with actual ID):
-- SELECT add_product_batch('YOUR_PRODUCT_ID_HERE'::uuid, 10, 'TEST-BATCH-001', '2025-12-31'::date);

-- Test 5: Test getting all batches
SELECT * FROM get_all_batches() LIMIT 5;