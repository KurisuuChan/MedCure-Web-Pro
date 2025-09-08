-- ==========================================
-- HISTORICAL SALES DATA GENERATOR
-- ==========================================
-- Generates realistic sales data for ML algorithm testing
-- This populates pos_transaction_items and sales tables with 90 days of data

-- Step 1: Create sample sales transactions over last 90 days
DO $$
DECLARE
    product_rec RECORD;
    day_offset INTEGER;
    sales_per_day INTEGER;
    sale_id UUID;
    current_user_id UUID;
    random_total DECIMAL;
    random_quantity INTEGER;
    random_price DECIMAL;
    available_stock INTEGER;
BEGIN
    -- Get the admin user ID
    SELECT id INTO current_user_id FROM users WHERE email = 'admin@medcure.com' LIMIT 1;
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'Admin user not found, using first available user';
        SELECT id INTO current_user_id FROM users LIMIT 1;
    END IF;
    
    RAISE NOTICE 'Generating historical sales data for user: %', current_user_id;
    
    -- Temporarily disable only the custom stock update trigger (not system triggers)
    ALTER TABLE sale_items DISABLE TRIGGER trigger_update_stock_on_sale;
    
    RAISE NOTICE 'Stock validation trigger temporarily disabled for historical data generation';
    
    -- Generate sales for each active product over last 90 days
    FOR product_rec IN (
        SELECT id, name, price_per_piece, stock_in_pieces 
        FROM products 
        WHERE is_active = TRUE 
        AND stock_in_pieces > 0  -- Only products with some stock
        LIMIT 15  -- Focus on top 15 products for realistic data
    ) LOOP
        
        RAISE NOTICE 'Generating sales for product: % (Stock: %)', product_rec.name, product_rec.stock_in_pieces;
        available_stock := product_rec.stock_in_pieces;
        
        -- Generate sales for last 90 days
        FOR day_offset IN 1..90 LOOP
            -- Random number of sales per day (0-3 sales per product per day)
            sales_per_day := floor(random() * 4)::INTEGER;
            
            -- Generate sales for this day
            FOR i IN 1..sales_per_day LOOP
                -- Exit if we've used up all stock for this product
                EXIT WHEN available_stock <= 0;
                
                -- Random quantity (1-5 pieces per sale, but not more than available stock)
                random_quantity := LEAST((floor(random() * 5) + 1)::INTEGER, available_stock);
                
                -- Skip if no stock available
                CONTINUE WHEN random_quantity <= 0;
                
                -- Reduce available stock for next iteration
                available_stock := available_stock - random_quantity;
                
                -- FIXED: Calculate unit price and explicitly ROUND it to 2 decimal places
                random_price := ROUND((product_rec.price_per_piece + (random() * 2 - 1))::numeric, 2);
                
                -- FIXED: Calculate the total using the rounded unit price
                random_total := random_quantity * random_price;
                
                -- Create sales transaction
                INSERT INTO sales (
                    id,
                    user_id,
                    total_amount,
                    tax_amount,
                    payment_method,
                    status,
                    customer_name,
                    created_at,
                    updated_at
                ) VALUES (
                    uuid_generate_v4(),
                    current_user_id,
                    random_total,
                    random_total * 0.12, -- 12% tax
                    CASE (random() * 3)::INTEGER 
                        WHEN 0 THEN 'cash'
                        WHEN 1 THEN 'card'
                        ELSE 'digital'  -- Fixed: Changed 'mobile' to 'digital'
                    END,
                    'completed',
                    'Customer ' || (floor(random() * 100) + 1),
                    NOW() - INTERVAL '1 day' * day_offset + INTERVAL '1 hour' * (random() * 12),
                    NOW() - INTERVAL '1 day' * day_offset + INTERVAL '1 hour' * (random() * 12)
                ) RETURNING id INTO sale_id;
                
                -- Create corresponding sale item
                INSERT INTO sale_items (
                    id,
                    sale_id,
                    product_id,
                    quantity,
                    unit_type,
                    unit_price,
                    total_price,
                    created_at
                ) VALUES (
                    uuid_generate_v4(),
                    sale_id,
                    product_rec.id,
                    random_quantity,
                    'piece',
                    random_price, -- Use the rounded price
                    random_total, -- Use the consistent total calculated from the rounded price
                    NOW() - INTERVAL '1 day' * day_offset + INTERVAL '1 hour' * (random() * 12)
                );
                
            END LOOP;
        END LOOP;
    END LOOP;
    
    -- Re-enable the specific stock update trigger
    ALTER TABLE sale_items ENABLE TRIGGER trigger_update_stock_on_sale;
    
    RAISE NOTICE '✅ Historical sales data generation completed!';
    RAISE NOTICE '🔄 Stock validation trigger re-enabled';
    
END $$;

-- Step 2: Update stock movements to reflect the sales
INSERT INTO stock_movements (
    product_id,
    user_id,
    movement_type,
    quantity,
    reason,
    reference_id,
    reference_type,
    stock_before,
    stock_after,
    created_at
)
SELECT 
    si.product_id,
    s.user_id,
    'out',
    -si.quantity, -- Negative for outgoing stock
    'Sale transaction',
    si.sale_id,
    'sale',
    p.stock_in_pieces + si.quantity, -- Stock before sale
    p.stock_in_pieces, -- Stock after sale
    si.created_at
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
JOIN products p ON si.product_id = p.id
WHERE si.created_at > NOW() - INTERVAL '90 days'
AND NOT EXISTS (
    SELECT 1 FROM stock_movements sm 
    WHERE sm.reference_id = si.sale_id 
    AND sm.reference_type = 'sale'
);

-- Step 3: Validation queries
SELECT 
    'HISTORICAL_DATA_SUMMARY' as summary_type,
    COUNT(*) as total_sales,
    COUNT(DISTINCT DATE(created_at)) as unique_sales_days,
    MIN(created_at) as earliest_sale,
    MAX(created_at) as latest_sale,
    ROUND(AVG(total_amount), 2) as avg_sale_amount
FROM sales 
WHERE created_at > NOW() - INTERVAL '90 days';

-- Product-wise sales summary
SELECT 
    p.name as product_name,
    COUNT(si.*) as total_sales,
    SUM(si.quantity) as total_quantity_sold,
    ROUND(SUM(si.total_price), 2) as total_revenue,
    ROUND(AVG(si.quantity), 1) as avg_quantity_per_sale
FROM products p
JOIN sale_items si ON p.id = si.product_id
JOIN sales s ON si.sale_id = s.id
WHERE s.created_at > NOW() - INTERVAL '90 days'
GROUP BY p.id, p.name
ORDER BY total_revenue DESC
LIMIT 10;

-- Step 4: Success messages
DO $$
BEGIN
    RAISE NOTICE '🎯 Ready for ML algorithm testing with rich historical data!';
    RAISE NOTICE 'Run window.SystemValidationRoadmap.runCompleteValidation() to test ML algorithms';
END $$;
