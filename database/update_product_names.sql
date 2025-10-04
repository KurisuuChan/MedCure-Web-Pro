-- Update products with proper names based on your sales data
-- This will fix the "Unknown Brand" and "Unknown Generic" issues

-- First, let's see what products we're dealing with
SELECT 
    si.product_id,
    p.generic_name,
    p.brand_name,
    SUM(si.quantity) as total_sold
FROM sale_items si
INNER JOIN products p ON p.id = si.product_id
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
  AND s.status = 'completed'
GROUP BY si.product_id, p.generic_name, p.brand_name
ORDER BY total_sold DESC;

-- Based on your earlier data showing Amoxicillin=544, Paracetamol=3, Ascorbic Acid=2
-- Let's update the top selling products with proper names

-- Update the Amoxicillin product (highest seller - 544 units)
UPDATE products 
SET 
    generic_name = 'Amoxicillin',
    brand_name = 'Amoxil'
WHERE id = (
    SELECT si.product_id
    FROM sale_items si
    INNER JOIN sales s ON s.id = si.sale_id
    WHERE s.created_at >= NOW() - INTERVAL '30 days'
      AND s.status = 'completed'
    GROUP BY si.product_id
    ORDER BY SUM(si.quantity) DESC
    LIMIT 1
);

-- Update the Paracetamol product (second highest - 3 units)
UPDATE products 
SET 
    generic_name = 'Paracetamol',
    brand_name = 'Biogesic'
WHERE id = (
    SELECT si.product_id
    FROM sale_items si
    INNER JOIN sales s ON s.id = si.sale_id
    WHERE s.created_at >= NOW() - INTERVAL '30 days'
      AND s.status = 'completed'
    GROUP BY si.product_id
    ORDER BY SUM(si.quantity) DESC
    LIMIT 1 OFFSET 1
);

-- Update the Ascorbic Acid product (third highest - 2 units)
UPDATE products 
SET 
    generic_name = 'Ascorbic Acid',
    brand_name = 'Cecon'
WHERE id = (
    SELECT si.product_id
    FROM sale_items si
    INNER JOIN sales s ON s.id = si.sale_id
    WHERE s.created_at >= NOW() - INTERVAL '30 days'
      AND s.status = 'completed'
    GROUP BY si.product_id
    ORDER BY SUM(si.quantity) DESC
    LIMIT 1 OFFSET 2
);

-- Verify the updates
SELECT 
    si.product_id,
    p.generic_name,
    p.brand_name,
    SUM(si.quantity) as total_sold
FROM sale_items si
INNER JOIN products p ON p.id = si.product_id
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
  AND s.status = 'completed'
GROUP BY si.product_id, p.generic_name, p.brand_name
ORDER BY total_sold DESC;