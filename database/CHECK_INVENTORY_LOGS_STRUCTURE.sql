-- ============================================
-- INVENTORY LOGS TABLE DIAGNOSTIC
-- ============================================
-- Run this first to see what columns exist in your inventory_logs table

-- Check what columns exist in your inventory_logs table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'inventory_logs' 
ORDER BY ordinal_position;

-- Also check if the table exists at all
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'inventory_logs';