-- Test the FEFO Sales Function
-- This file contains test scripts to verify the FEFO functionality

-- 1. First, let's check if we have sample data
SELECT 
    p.id,
    p.name,
    p.stock_in_pieces as total_stock,
    COUNT(pb.id) as batch_count,
    SUM(pb.quantity) as batch_total_stock
FROM products p
LEFT JOIN product_batches pb ON p.id = pb.product_id AND pb.quantity > 0
GROUP BY p.id, p.name, p.stock_in_pieces
HAVING COUNT(pb.id) > 0
ORDER BY p.name
LIMIT 5;

-- 2. Check individual batches for a product (replace with actual product_id)
-- SELECT 
--     pb.id,
--     pb.batch_number,
--     pb.quantity,
--     pb.expiry_date,
--     pb.created_at,
--     CASE 
--         WHEN pb.expiry_date IS NULL THEN 'No expiry'
--         WHEN pb.expiry_date < NOW() THEN 'Expired'
--         WHEN pb.expiry_date < NOW() + INTERVAL '30 days' THEN 'Expiring soon'
--         ELSE 'Good'
--     END as expiry_status
-- FROM product_batches pb
-- WHERE pb.product_id = 'YOUR_PRODUCT_ID_HERE'
--     AND pb.quantity > 0
-- ORDER BY 
--     CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END,
--     pb.expiry_date ASC NULLS LAST,
--     pb.created_at ASC;

-- 3. Test FEFO function (replace with actual values)
-- SELECT process_sale_fefo(
--     'YOUR_PRODUCT_ID_HERE'::UUID,  -- product_id
--     5,                             -- quantity_to_sell
--     'YOUR_USER_ID_HERE'::UUID,     -- user_id (optional)
--     'YOUR_SALE_ID_HERE'::UUID,     -- sale_id (optional)
--     'Test FEFO sale'               -- notes (optional)
-- );

-- 4. After running FEFO, check the results
-- SELECT 
--     pb.id,
--     pb.batch_number,
--     pb.quantity,
--     pb.expiry_date,
--     pb.updated_at
-- FROM product_batches pb
-- WHERE pb.product_id = 'YOUR_PRODUCT_ID_HERE'
-- ORDER BY 
--     CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END,
--     pb.expiry_date ASC NULLS LAST,
--     pb.created_at ASC;

-- 5. Check inventory logs for the sale
-- SELECT 
--     il.id,
--     il.product_id,
--     il.batch_id,
--     il.action_type,
--     il.quantity_change,
--     il.quantity_after,
--     il.notes,
--     il.created_at
-- FROM inventory_logs il
-- WHERE il.reference_id = 'YOUR_SALE_ID_HERE'
-- ORDER BY il.created_at DESC;

-- 6. Check updated product total stock
-- SELECT 
--     p.id,
--     p.name,
--     p.stock_in_pieces,
--     SUM(pb.quantity) as calculated_stock
-- FROM products p
-- LEFT JOIN product_batches pb ON p.id = pb.product_id
-- WHERE p.id = 'YOUR_PRODUCT_ID_HERE'
-- GROUP BY p.id, p.name, p.stock_in_pieces;

-- EXAMPLE USAGE:
-- 1. Find a product with batches:
--    Copy a product_id from the first query
-- 
-- 2. Replace YOUR_PRODUCT_ID_HERE with the actual product ID
-- 
-- 3. Replace YOUR_USER_ID_HERE with your user ID (or use NULL)
-- 
-- 4. Replace YOUR_SALE_ID_HERE with a sale ID (or use NULL for testing)
-- 
-- 5. Run the FEFO function test
-- 
-- 6. Check the results using queries 4, 5, and 6

-- Advanced test: Simulate a sale that spans multiple batches
-- This will test the FEFO logic across batches with different expiry dates
/*
DO $$
DECLARE
    test_product_id UUID;
    test_user_id UUID;
    test_sale_id UUID;
    fefo_result JSONB;
BEGIN
    -- Get a product with multiple batches (adjust query as needed)
    SELECT p.id INTO test_product_id
    FROM products p
    JOIN product_batches pb ON p.id = pb.product_id
    WHERE pb.quantity > 0
    GROUP BY p.id
    HAVING COUNT(pb.id) > 1
    LIMIT 1;
    
    -- Generate test IDs
    test_user_id := gen_random_uuid();
    test_sale_id := gen_random_uuid();
    
    -- Test FEFO with a large quantity that should span multiple batches
    SELECT process_sale_fefo(
        test_product_id,
        50,  -- Large quantity to test multiple batch deduction
        test_user_id,
        test_sale_id,
        'Multi-batch FEFO test'
    ) INTO fefo_result;
    
    -- Display results
    RAISE NOTICE 'FEFO Test Results: %', fefo_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FEFO Test Failed: %', SQLERRM;
END $$;
*/