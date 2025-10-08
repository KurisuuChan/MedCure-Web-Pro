-- Database diagnostic query to check customer-related tables
-- Run this in Supabase SQL Editor

-- Check if customers table exists and its structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if sales table exists and has customer fields
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND table_schema = 'public'
AND column_name LIKE '%customer%'
ORDER BY ordinal_position;

-- Check sample data from customers table (if exists)
SELECT COUNT(*) as customer_count FROM customers WHERE is_active = true;

-- Check sample data from sales table customer fields (if exists)
SELECT DISTINCT customer_name 
FROM sales 
WHERE customer_name IS NOT NULL 
AND customer_name != '[DELETED CUSTOMER]'
LIMIT 5;