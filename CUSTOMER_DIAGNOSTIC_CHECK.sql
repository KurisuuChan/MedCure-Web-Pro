-- ============================================
-- CUSTOMER TABLE DIAGNOSTIC CHECK
-- ============================================
-- Let's see the exact structure of your customer-related tables

-- 1. Check customers table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- 2. Check if there are any customers in the table
SELECT COUNT(*) as customer_count FROM customers;

-- 3. Show sample customer data (first 3 customers)
SELECT * FROM customers LIMIT 3;

-- 4. Check sales table customer-related fields
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND (column_name LIKE '%customer%' OR column_name LIKE '%client%')
ORDER BY ordinal_position;

-- 5. Check if we have a customer_id foreign key relationship
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name = 'sales' OR tc.table_name = 'customers');

-- 6. Show recent sales with customer data
SELECT 
    id,
    customer_id,
    customer_name,
    customer_phone,
    total_amount,
    created_at
FROM sales 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '🔍 CUSTOMER DIAGNOSTIC COMPLETE' as status;