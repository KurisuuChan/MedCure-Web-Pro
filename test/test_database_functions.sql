-- =============================================================================
-- COMPREHENSIVE FUNCTIONALITY TEST SCRIPT
-- =============================================================================
-- Test all enhanced search functions and database operations

-- Test 1: Basic search function
SELECT 'TEST 1: Basic search function' as test_name;
SELECT COUNT(*) as product_count FROM search_products('');

-- Test 2: Search with term
SELECT 'TEST 2: Search with specific term' as test_name;
SELECT generic_name, brand_name, manufacturer FROM search_products('a') LIMIT 3;

-- Test 3: Filtered search
SELECT 'TEST 3: Filtered search function' as test_name;
SELECT COUNT(*) as filtered_count FROM search_products_filtered('', '', '', '', 10);

-- Test 4: Get manufacturers
SELECT 'TEST 4: Get distinct manufacturers' as test_name;
SELECT COUNT(*) as manufacturer_count FROM get_distinct_manufacturers();

-- Test 5: Get drug classifications
SELECT 'TEST 5: Get distinct drug classifications' as test_name;
SELECT COUNT(*) as classification_count FROM get_distinct_drug_classifications();

-- Test 6: Regular product query (backward compatibility)
SELECT 'TEST 6: Regular product query' as test_name;
SELECT COUNT(*) as regular_count FROM products WHERE is_active = true;

-- Test 7: Check if all new columns exist and have data
SELECT 'TEST 7: Column data check' as test_name;
SELECT 
  COUNT(CASE WHEN generic_name IS NOT NULL THEN 1 END) as has_generic_name,
  COUNT(CASE WHEN brand_name IS NOT NULL THEN 1 END) as has_brand_name,
  COUNT(CASE WHEN manufacturer IS NOT NULL THEN 1 END) as has_manufacturer,
  COUNT(CASE WHEN drug_classification IS NOT NULL THEN 1 END) as has_classification
FROM products WHERE is_active = true;