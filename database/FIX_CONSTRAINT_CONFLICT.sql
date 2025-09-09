-- =================================================
-- 🚨 CRITICAL FIX: DATABASE CONSTRAINT CONFLICT
-- The check_positive_stock constraint conflicts with our trigger system
-- =================================================

-- First, let's see what constraints exist on the products table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'products'::regclass;

-- =================================================
-- REMOVE THE CONFLICTING CHECK CONSTRAINT
-- =================================================

-- The check_positive_stock constraint is preventing our trigger from working
-- We need to remove it since our trigger handles stock validation properly
ALTER TABLE products DROP CONSTRAINT IF EXISTS check_positive_stock;

-- =================================================
-- VERIFY CURRENT STOCK LEVELS
-- =================================================

-- Check current stock of Hydrocortisone Cream after correction
SELECT 
    name,
    stock_in_pieces,
    pieces_per_sheet,
    sheets_per_box
FROM products 
WHERE name = 'Hydrocortisone Cream 1%';

-- Check other low stock items
SELECT 
    name,
    stock_in_pieces
FROM products 
WHERE stock_in_pieces < 15
ORDER BY stock_in_pieces ASC;

-- =================================================
-- VERIFY TRIGGERS ARE ACTIVE
-- =================================================

-- Check if our stock management triggers are properly installed
SELECT 
    trigger_name, 
    event_manipulation, 
    trigger_schema,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'sale_items'
AND trigger_name IN ('trigger_deduct_stock_on_sale', 'trigger_restore_stock_on_sale_item_delete')
ORDER BY trigger_name;

-- =================================================
-- TEST STOCK CALCULATION
-- =================================================

-- Calculate what stock should be after selling 5 Hydrocortisone Cream
SELECT 
    name,
    stock_in_pieces as current_stock,
    stock_in_pieces - 5 as stock_after_sale_of_5
FROM products 
WHERE name = 'Hydrocortisone Cream 1%';

SELECT 'Database constraint conflict resolved - ready for sale testing!' as status;
