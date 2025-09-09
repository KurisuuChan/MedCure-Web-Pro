-- =================================================
-- 🔧 CREATE TEST TRANSACTION DATA FOR DEBUGGING
-- Quick test data to verify transaction editing functionality
-- =================================================

-- First, let's check if we have any existing sales data
SELECT 
    'Existing Sales Count' as check_type,
    COUNT(*) as count,
    MAX(created_at) as latest_sale
FROM sales;

-- Check if we have sale_items 
SELECT 
    'Existing Sale Items Count' as check_type,
    COUNT(*) as count
FROM sale_items;

-- Check if we have products
SELECT 
    'Existing Products Count' as check_type,
    COUNT(*) as count
FROM products;

-- If no data exists, we need to create some test transactions
-- Let's create a fresh test transaction with items

DO $$
DECLARE
    test_sale_id UUID;
    user_id UUID;
    product1_id UUID;
    product2_id UUID;
    product3_id UUID;
BEGIN
    -- Get or create a test user
    SELECT id INTO user_id FROM users WHERE email = 'test@pharmacy.com' LIMIT 1;
    
    IF user_id IS NULL THEN
        INSERT INTO users (email, first_name, last_name, role, is_active)
        VALUES ('test@pharmacy.com', 'Test', 'User', 'cashier', true)
        RETURNING id INTO user_id;
    END IF;

    -- Create test products if they don't exist
    SELECT id INTO product1_id FROM products WHERE name = 'Test Paracetamol 500mg' LIMIT 1;
    IF product1_id IS NULL THEN
        INSERT INTO products (name, brand, category, price_per_piece, pieces_per_sheet, sheets_per_box, stock_in_pieces, reorder_level, supplier, expiry_date, batch_number, is_active)
        VALUES ('Test Paracetamol 500mg', 'TestBrand', 'Pain Relief', 25.50, 10, 10, 1000, 100, 'Test Supplier', '2025-12-31', 'TEST001', true)
        RETURNING id INTO product1_id;
    END IF;

    SELECT id INTO product2_id FROM products WHERE name = 'Test Vitamin C 1000mg' LIMIT 1;
    IF product2_id IS NULL THEN
        INSERT INTO products (name, brand, category, price_per_piece, pieces_per_sheet, sheets_per_box, stock_in_pieces, reorder_level, supplier, expiry_date, batch_number, is_active)
        VALUES ('Test Vitamin C 1000mg', 'TestBrand', 'Vitamins', 45.00, 10, 10, 500, 50, 'Test Supplier', '2025-12-31', 'TEST002', true)
        RETURNING id INTO product2_id;
    END IF;

    SELECT id INTO product3_id FROM products WHERE name = 'Test Amoxicillin 500mg' LIMIT 1;
    IF product3_id IS NULL THEN
        INSERT INTO products (name, brand, category, price_per_piece, pieces_per_sheet, sheets_per_box, stock_in_pieces, reorder_level, supplier, expiry_date, batch_number, is_active)
        VALUES ('Test Amoxicillin 500mg', 'TestBrand', 'Antibiotics', 89.50, 10, 5, 250, 25, 'Test Supplier', '2025-12-31', 'TEST003', true)
        RETURNING id INTO product3_id;
    END IF;

    -- Create a test sale transaction (recent, within 24 hours)
    INSERT INTO sales (
        user_id,
        total_amount,
        payment_method,
        customer_name,
        customer_phone,
        status,
        created_at
    )
    VALUES (
        user_id,
        275.50,
        'cash',
        'Test Customer',
        '09123456789',
        'completed',
        NOW() - INTERVAL '2 hours' -- Created 2 hours ago (editable)
    )
    RETURNING id INTO test_sale_id;

    -- Add test sale items using actual product UUIDs
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_type, unit_price, total_price)
    VALUES 
        (test_sale_id, product1_id, 2, 'piece', 25.50, 51.00),
        (test_sale_id, product2_id, 3, 'piece', 45.00, 135.00),
        (test_sale_id, product3_id, 1, 'piece', 89.50, 89.50);

    RAISE NOTICE 'Test transaction created with ID: %', test_sale_id;
END $$;

-- Create another test transaction (older, for testing disabled state)
DO $$
DECLARE
    test_sale_id UUID;
    user_id UUID;
    product1_id UUID;
    product2_id UUID;
BEGIN
    -- Get the test user
    SELECT id INTO user_id FROM users WHERE email = 'test@pharmacy.com' LIMIT 1;
    
    -- Get existing test products
    SELECT id INTO product1_id FROM products WHERE name = 'Test Paracetamol 500mg' LIMIT 1;
    SELECT id INTO product2_id FROM products WHERE name = 'Test Vitamin C 1000mg' LIMIT 1;
    
    -- Create an older test sale transaction (25 hours ago - not editable)
    INSERT INTO sales (
        user_id,
        total_amount,
        payment_method,
        customer_name,
        status,
        created_at
    )
    VALUES (
        user_id,
        150.00,
        'card',
        'Old Customer',
        'completed',
        NOW() - INTERVAL '25 hours' -- Created 25 hours ago (not editable)
    )
    RETURNING id INTO test_sale_id;

    -- Add test sale items using actual product UUIDs
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_type, unit_price, total_price)
    VALUES 
        (test_sale_id, product1_id, 3, 'piece', 25.00, 75.00),
        (test_sale_id, product2_id, 1, 'piece', 75.00, 75.00);

    RAISE NOTICE 'Old test transaction created with ID: %', test_sale_id;
END $$;

-- Verify the test data
SELECT 
    s.id,
    s.total_amount,
    s.payment_method,
    s.customer_name,
    s.created_at,
    s.is_edited,
    COUNT(si.id) as item_count,
    EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 3600 as hours_old,
    CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 3600 <= 24 
        THEN 'EDITABLE' 
        ELSE 'NOT EDITABLE' 
    END as edit_status
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE s.customer_name LIKE '%Test%' OR s.customer_name LIKE '%Old%'
GROUP BY s.id, s.total_amount, s.payment_method, s.customer_name, s.created_at, s.is_edited
ORDER BY s.created_at DESC;

-- Check sale items for the test transactions
SELECT 
    si.id,
    si.sale_id,
    si.product_id,
    si.quantity,
    si.unit_type,
    si.unit_price,
    si.total_price,
    p.name as product_name
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
LEFT JOIN products p ON si.product_id = p.id
WHERE s.customer_name LIKE '%Test%' OR s.customer_name LIKE '%Old%'
ORDER BY si.sale_id, si.id;

SELECT 
    '🎉 TEST TRANSACTION DATA CREATED!' as status,
    'Check POS page transaction history to test editing' as instruction,
    'Edit buttons should be enabled for recent transactions' as note;
