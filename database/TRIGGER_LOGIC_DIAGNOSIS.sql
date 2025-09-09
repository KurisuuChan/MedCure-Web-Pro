-- 🔍 COMPREHENSIVE TRIGGER AND LOGIC DIAGNOSIS
-- Run these queries in Supabase SQL Editor to check for competing logic

-- 1. CHECK ALL TRIGGERS ON SALES AND SALE_ITEMS TABLES
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('sales', 'sale_items')
ORDER BY event_object_table, trigger_name;

-- 2. CHECK FOR ANY FUNCTIONS THAT MIGHT AUTO-DEDUCT STOCK
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (
    routine_definition ILIKE '%stock_in_pieces%' 
    OR routine_definition ILIKE '%UPDATE products%'
    OR routine_name ILIKE '%stock%'
    OR routine_name ILIKE '%deduct%'
)
ORDER BY routine_name;

-- 3. TEST CURRENT STOCK DEDUCTION BEHAVIOR
-- Let's see what happens when we create and complete a transaction

-- First, check a product's current stock
SELECT 
    id,
    name,
    stock_in_pieces,
    price_per_piece
FROM products 
WHERE stock_in_pieces > 10 
AND is_active = true
LIMIT 1;

-- 4. CHECK RECENT TRANSACTION PATTERNS
SELECT 
    s.id,
    s.status,
    s.total_amount,
    s.created_at,
    si.product_id,
    si.quantity,
    si.unit_type,
    p.name as product_name,
    p.stock_in_pieces as current_stock
FROM sales s
JOIN sale_items si ON s.id = si.sale_id
JOIN products p ON si.product_id = p.id
WHERE s.created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY s.created_at DESC
LIMIT 10;

-- 5. CHECK FOR POLICIES THAT MIGHT AFFECT OPERATIONS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('sales', 'sale_items', 'products')
ORDER BY tablename, policyname;

-- 6. SIMULATE A STOCK DEDUCTION TEST
-- This will help us see if there are competing triggers
-- (UNCOMMENT AND MODIFY WITH ACTUAL PRODUCT ID TO TEST)

/*
-- Get initial stock
SELECT stock_in_pieces FROM products WHERE id = 1; -- Replace 1 with actual product ID

-- Create a test sale
INSERT INTO sales (user_id, total_amount, payment_method, status) 
VALUES ('test-user', 100.00, 'cash', 'pending') 
RETURNING id;

-- Insert sale item (replace sale_id with the returned ID above)
INSERT INTO sale_items (sale_id, product_id, quantity, unit_type, unit_price, total_price)
VALUES (LAST_SALE_ID, 1, 2, 'piece', 50.00, 100.00); -- Replace LAST_SALE_ID and product_id

-- Check stock after insert (should it change? It shouldn't for pending transactions)
SELECT stock_in_pieces FROM products WHERE id = 1;

-- Now complete the transaction
UPDATE sales SET status = 'completed' WHERE id = LAST_SALE_ID;

-- Check stock after completion (this is where we'll see if there are competing deductions)
SELECT stock_in_pieces FROM products WHERE id = 1;

-- Clean up test data
DELETE FROM sale_items WHERE sale_id = LAST_SALE_ID;
DELETE FROM sales WHERE id = LAST_SALE_ID;
*/

-- 7. CHECK SPECIFIC TRIGGER DEFINITIONS
-- This will show us exactly what each trigger does
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.action_timing || ' ' || t.event_manipulation as trigger_event,
    pg_get_triggerdef(tr.oid) as trigger_definition
FROM information_schema.triggers t
JOIN pg_trigger tr ON tr.tgname = t.trigger_name
WHERE t.event_object_table IN ('sales', 'sale_items')
ORDER BY t.event_object_table, t.trigger_name;

-- 8. CHECK FOR FUNCTIONS CALLED BY OUR MAIN FUNCTIONS
-- This helps identify if our functions call other functions that might cause issues
SELECT 
    routine_name,
    CASE 
        WHEN routine_definition ILIKE '%complete_transaction_with_stock%' THEN 'Calls complete_transaction_with_stock'
        WHEN routine_definition ILIKE '%create_sale_with_items%' THEN 'Calls create_sale_with_items'
        WHEN routine_definition ILIKE '%undo_transaction_completely%' THEN 'Calls undo_transaction_completely'
        WHEN routine_definition ILIKE '%UPDATE products SET stock_in_pieces%' THEN 'Updates stock directly'
        ELSE 'Other'
    END as function_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition IS NOT NULL
AND (
    routine_definition ILIKE '%complete_transaction_with_stock%'
    OR routine_definition ILIKE '%create_sale_with_items%'
    OR routine_definition ILIKE '%undo_transaction_completely%'
    OR routine_definition ILIKE '%UPDATE products SET stock_in_pieces%'
)
ORDER BY function_type, routine_name;
