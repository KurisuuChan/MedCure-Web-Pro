-- 🚨 CRITICAL ISSUE IDENTIFIED: CONFLICTING LOGIC IN FUNCTIONS
-- The edit_transaction_with_stock_management function has competing logic

-- 1. EXAMINE THE EXACT FUNCTION DEFINITION
-- This will show us what the problematic function is doing
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'edit_transaction_with_stock_management'
AND routine_schema = 'public';

-- 2. CHECK ALL TRIGGERS (should return empty if properly cleaned)
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('sales', 'sale_items')
ORDER BY event_object_table, trigger_name;

-- 3. CHECK FOR OTHER PROBLEMATIC FUNCTIONS
-- Look for any function that both calls our main functions AND updates stock directly
SELECT 
    routine_name,
    COUNT(*) as conflict_count
FROM (
    SELECT 
        routine_name,
        CASE 
            WHEN routine_definition ILIKE '%complete_transaction_with_stock%' THEN 'calls_complete'
            WHEN routine_definition ILIKE '%create_sale_with_items%' THEN 'calls_create'
            WHEN routine_definition ILIKE '%undo_transaction_completely%' THEN 'calls_undo'
            WHEN routine_definition ILIKE '%UPDATE products SET stock_in_pieces%' THEN 'updates_stock'
        END as operation_type
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
    AND routine_definition IS NOT NULL
    AND (
        routine_definition ILIKE '%complete_transaction_with_stock%'
        OR routine_definition ILIKE '%create_sale_with_items%'
        OR routine_definition ILIKE '%undo_transaction_completely%'
        OR routine_definition ILIKE '%UPDATE products SET stock_in_pieces%'
    )
) conflicts
WHERE operation_type IS NOT NULL
GROUP BY routine_name
HAVING COUNT(*) > 1
ORDER BY conflict_count DESC;

-- 4. TEST A SIMPLE MANUAL TRANSACTION TO SEE BEHAVIOR
-- Let's test what happens with a manual insert/update (without using functions)

-- Get a test product first
SELECT 
    id,
    name,
    stock_in_pieces,
    price_per_piece
FROM products 
WHERE stock_in_pieces > 50 
AND is_active = true
LIMIT 1;

-- 5. CHECK WHAT HAPPENS WHEN WE MANUALLY INSERT DATA
-- (This tests if there are triggers firing on basic operations)
-- IMPORTANT: Replace the product_id below with actual ID from query above

-- First get current stock for product ID 1 (replace with actual ID)
-- SELECT stock_in_pieces FROM products WHERE id = 1;

-- Test manual insert into sales
-- INSERT INTO sales (user_id, total_amount, payment_method, status) 
-- VALUES ('manual-test', 25.00, 'cash', 'pending') 
-- RETURNING id;

-- Test manual insert into sale_items (replace sale_id with ID from above)
-- INSERT INTO sale_items (sale_id, product_id, quantity, unit_type, unit_price, total_price)
-- VALUES (REPLACE_WITH_SALE_ID, 1, 1, 'piece', 25.00, 25.00);

-- Check if stock changed after manual insert (it shouldn't for pending)
-- SELECT stock_in_pieces FROM products WHERE id = 1;

-- Update status to completed
-- UPDATE sales SET status = 'completed' WHERE id = REPLACE_WITH_SALE_ID;

-- Check if stock changed after status update (this will tell us about triggers)
-- SELECT stock_in_pieces FROM products WHERE id = 1;

-- Clean up
-- DELETE FROM sale_items WHERE sale_id = REPLACE_WITH_SALE_ID;
-- DELETE FROM sales WHERE id = REPLACE_WITH_SALE_ID;

-- 6. CHECK OUR MAIN FUNCTIONS FOR INTERNAL CONFLICTS
-- See if complete_transaction_with_stock calls other functions
SELECT 
    routine_name,
    LENGTH(routine_definition) as function_size,
    routine_definition ILIKE '%PERFORM%' as calls_other_functions,
    routine_definition ILIKE '%SELECT%' as has_selects,
    routine_definition ILIKE '%UPDATE%' as has_updates,
    routine_definition ILIKE '%INSERT%' as has_inserts
FROM information_schema.routines 
WHERE routine_name IN (
    'create_sale_with_items',
    'complete_transaction_with_stock', 
    'undo_transaction_completely'
)
AND routine_schema = 'public'
ORDER BY routine_name;
