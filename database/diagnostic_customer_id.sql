-- Quick diagnostic to check if database function includes customer_id
-- Run this in Supabase SQL Editor to verify the fix

-- 1. Check if customer_id column exists in sales table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales' 
  AND table_schema = 'public'
  AND column_name = 'customer_id';

-- 2. Check the create_sale_with_items function definition
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_sale_with_items'
  AND routine_schema = 'public';

-- 3. Check recent sales records to see if customer_id is being populated
SELECT id, customer_id, customer_name, customer_phone, created_at
FROM public.sales 
WHERE created_at >= NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check if customers table exists and has data
SELECT COUNT(*) as customer_count FROM public.customers WHERE is_active = true;