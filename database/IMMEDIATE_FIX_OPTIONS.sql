-- 🔧 IMMEDIATE FIX FOR DOUBLE STOCK DEDUCTION
-- Based on diagnosis: edit_transaction_with_stock_management has conflicting logic

-- OPTION 1: TEMPORARY DISABLE THE PROBLEMATIC FUNCTION
-- This will force the system to use the basic edit function instead
-- UNCOMMENT to apply:

-- DROP FUNCTION IF EXISTS edit_transaction_with_stock_management;

-- OPTION 2: IDENTIFY AND REMOVE COMPETING TRIGGERS (RECOMMENDED)
-- First, let's see what triggers exist:

SELECT 
    'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON ' || event_object_table || ';' as cleanup_command
FROM information_schema.triggers 
WHERE event_object_table IN ('sales', 'sale_items')
AND trigger_name ILIKE '%stock%'
ORDER BY event_object_table, trigger_name;

-- OPTION 3: CHECK IF THERE ARE AUTOMATIC STOCK DEDUCTION TRIGGERS
-- These are common culprits for double deduction:

SELECT 
    trigger_name,
    event_object_table,
    'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON ' || event_object_table || ';' as remove_command
FROM information_schema.triggers 
WHERE event_object_table IN ('sales', 'sale_items')
AND (
    trigger_name ILIKE '%deduct%' 
    OR trigger_name ILIKE '%stock%'
    OR trigger_name ILIKE '%update%'
    OR action_statement ILIKE '%stock_in_pieces%'
)
ORDER BY event_object_table, trigger_name;

-- OPTION 4: SAFE TESTING APPROACH
-- Test with a specific product to see exact behavior

-- Step 1: Get test product
SELECT 
    id,
    name,
    stock_in_pieces,
    'Test with this product' as note
FROM products 
WHERE stock_in_pieces > 20 
AND is_active = true
LIMIT 1;

-- Step 2: Record current stock
-- SELECT stock_in_pieces as initial_stock FROM products WHERE id = YOUR_PRODUCT_ID;

-- Step 3: Test our unified service functions
-- This will help us see which specific function causes double deduction

-- Test create_sale_with_items (should NOT deduct stock)
-- SELECT create_sale_with_items(
--     ROW(null, 'test-user', 50.00, 'cash', 'pending', null, null, null, 'none', 0, 0, 50.00, null)::sales,
--     ARRAY[ROW(YOUR_PRODUCT_ID, 2, 'piece', 25.00, 50.00)]
-- );

-- Check stock after create (should be unchanged)
-- SELECT stock_in_pieces as after_create FROM products WHERE id = YOUR_PRODUCT_ID;

-- Test complete_transaction_with_stock (should deduct stock)
-- SELECT complete_transaction_with_stock(YOUR_TRANSACTION_ID);

-- Check stock after complete (should be deducted)
-- SELECT stock_in_pieces as after_complete FROM products WHERE id = YOUR_PRODUCT_ID;

-- OPTION 5: EMERGENCY CLEANUP (USE ONLY IF NEEDED)
-- This removes all potentially conflicting triggers

-- UNCOMMENT these lines ONLY if you want to remove all stock-related triggers:
-- DROP TRIGGER IF EXISTS trigger_deduct_stock_on_sale ON sale_items;
-- DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sales;
-- DROP TRIGGER IF EXISTS professional_stock_management_trigger ON sale_items;
-- DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_item_delete ON sale_items;
-- DROP TRIGGER IF EXISTS auto_deduct_stock_trigger ON sale_items;
-- DROP TRIGGER IF EXISTS update_stock_on_completion ON sales;

-- VERIFICATION QUERY - Run this after any cleanup
-- Should return 0 rows if triggers are properly removed
SELECT 
    trigger_name,
    event_object_table,
    'WARNING: This trigger might cause conflicts' as warning
FROM information_schema.triggers 
WHERE event_object_table IN ('sales', 'sale_items')
ORDER BY event_object_table, trigger_name;
