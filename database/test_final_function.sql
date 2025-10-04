-- Test the RPC function with the actual product data
-- This should now work correctly since the products have proper names

-- Test the function directly
SELECT * FROM get_top_selling_products(30, 5);

-- Expected results based on your data:
-- 1. Amoxicillin/Amoxil - 544 units
-- 2. Paracetamol/Biogesic - 3 units  
-- 3. Ascorbic Acid/Cecon - 2 units

-- Verify the function is returning the correct format
SELECT 
    product_id,
    generic_name,
    brand_name,
    total_quantity,
    total_revenue,
    -- Test how the names should display
    CASE 
      WHEN brand_name IS NOT NULL AND brand_name != '' AND brand_name != 'Unknown Brand'
      THEN brand_name || ' (' || generic_name || ')'
      ELSE generic_name
    END as display_name
FROM get_top_selling_products(30, 5);