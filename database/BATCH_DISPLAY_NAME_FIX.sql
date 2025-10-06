-- ================================================================
-- BATCH DISPLAY NAME FIX
-- ================================================================
-- This fixes the medicine name display in batch management
-- Run this in Supabase SQL Editor
-- ================================================================

-- First, let's check what data we actually have:
SELECT 
    COUNT(*) as total_batches,
    COUNT(CASE WHEN p.brand_name IS NOT NULL THEN 1 END) as batches_with_brand,
    COUNT(CASE WHEN p.generic_name IS NOT NULL THEN 1 END) as batches_with_generic
FROM product_batches pb
LEFT JOIN products p ON pb.product_id = p.id;

-- Show sample batch data with names:
SELECT 
    pb.id as batch_id,
    pb.batch_number,
    p.brand_name,
    p.generic_name,
    p.category,
    pb.quantity,
    pb.expiry_date
FROM product_batches pb
LEFT JOIN products p ON pb.product_id = p.id
LIMIT 5;

-- If no batches exist, let's create a test batch for demonstration:
DO $$
DECLARE
    sample_product_id UUID;
    new_batch_id BIGINT;
BEGIN
    -- Get a sample product ID (or create one if needed)
    SELECT id INTO sample_product_id 
    FROM products 
    WHERE generic_name IS NOT NULL AND brand_name IS NOT NULL
    LIMIT 1;
    
    -- If we found a product, create a test batch
    IF sample_product_id IS NOT NULL THEN
        INSERT INTO product_batches (
            product_id,
            batch_number,
            quantity,
            expiry_date,
            cost_per_unit,
            supplier_name,
            status,
            created_at
        ) VALUES (
            sample_product_id,
            'BT' || TO_CHAR(NOW(), 'MMDDYY') || '-' || FLOOR(RANDOM() * 999 + 1),
            100 + FLOOR(RANDOM() * 900), -- Random quantity 100-999
            (CURRENT_DATE + INTERVAL '6 months'), -- Expires in 6 months
            5.50, -- Sample cost
            'Sample Supplier',
            'active',
            NOW()
        ) RETURNING id INTO new_batch_id;
        
        RAISE NOTICE 'Created test batch ID: % for product: %', new_batch_id, sample_product_id;
    ELSE
        RAISE NOTICE 'No products found with both brand_name and generic_name';
    END IF;
END $$;

-- Test the enhanced function to see what it returns:
SELECT 
    batch_id,
    product_name,
    product_brand_name,
    product_generic_name,
    quantity,
    expiry_date,
    status
FROM get_all_batches_enhanced()
LIMIT 5;