-- 🔍 CHECK IF CUSTOMERS TABLE EXISTS
-- Run this in Supabase SQL Editor to check your table structure

-- Check if customers table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'customers' 
AND table_schema = 'public';

-- If no results, check what customer-related tables you have
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%customer%';

-- Check if you're using sales table for customer data
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'sales';

-- If sales table exists, check its structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND table_schema = 'public'
AND column_name LIKE '%customer%';